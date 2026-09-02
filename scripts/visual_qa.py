#!/usr/bin/env python3
"""Repeatable visual and motion checks for the public robotics lab site.

The script intentionally keeps evidence outside the repository. It compares
composition and interaction behavior rather than pixels because the Catime
reference and the lab content are different products.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright
except ImportError as exc:  # pragma: no cover - environment guidance
    raise SystemExit("Python Playwright is required: python -m pip install playwright") from exc


DESKTOP = {"width": 1536, "height": 1024}
LAPTOP = {"width": 1280, "height": 900}
TABLET = {"width": 768, "height": 1024}
MOBILE = {"width": 390, "height": 844}


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def page_metrics(page: Page, console_errors: list[str]) -> dict[str, Any]:
    metrics = page.evaluate(
        """
        () => ({
          title: document.title,
          url: location.href,
          viewport: { width: innerWidth, height: innerHeight },
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          sections: [...document.querySelectorAll('main section')].map((section) => ({
            id: section.id || null,
            label: section.getAttribute('aria-label'),
            top: Math.round(section.getBoundingClientRect().top + scrollY),
            height: Math.round(section.getBoundingClientRect().height),
          })),
          publicVars: (() => {
            const root = document.querySelector('.public-site');
            if (!root) return null;
            const styles = getComputedStyle(root);
            return Object.fromEntries(['--glass-x', '--glass-y', '--glass-rx', '--glass-ry', '--scroll-force'].map((name) => [name, styles.getPropertyValue(name).trim()]));
          })(),
        })
        """
    )
    metrics["consoleErrors"] = list(console_errors)
    return metrics


def load_page(page: Page, url: str, timeout: int = 45_000) -> None:
    page.goto(url, wait_until="domcontentloaded", timeout=timeout)
    page.wait_for_timeout(900)


def reveal_page(page: Page) -> None:
    """Visit each viewport so scroll-reveal content is present in full-page evidence."""
    viewport_height = page.evaluate("() => innerHeight")
    page_height = page.evaluate("() => document.documentElement.scrollHeight")
    step = max(240, int(viewport_height * 0.78))
    for position in range(0, page_height + step, step):
        page.evaluate("(y) => window.scrollTo(0, y)", position)
        page.wait_for_timeout(120)
    page.evaluate("() => window.scrollTo(0, 0)")
    page.wait_for_timeout(250)


def transform_snapshot(page: Page) -> dict[str, str | None]:
    return page.evaluate(
        """
        () => {
          const layer = document.querySelector('.public-motion-layer');
          const hero = document.querySelector('[data-motion-probe="hero"]');
          const nav = document.querySelector('[data-motion-probe="nav"]');
          const magnetic = document.querySelector('a.glass-action')?.parentElement;
          const style = (element) => element ? getComputedStyle(element).transform : null;
          const root = document.querySelector('.public-site');
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            layer: style(layer),
            hero: style(hero),
            nav: style(nav),
            magnetic: style(magnetic),
            glassX: rootStyle?.getPropertyValue('--glass-x').trim() || null,
            glassY: rootStyle?.getPropertyValue('--glass-y').trim() || null,
            scrollForce: rootStyle?.getPropertyValue('--scroll-force').trim() || null,
          };
        }
        """
    )


def capture_reference(browser: Browser, reference_url: str, output: Path) -> dict[str, Any]:
    evidence: dict[str, Any] = {"url": reference_url, "captures": [], "error": None}
    errors: list[str] = []
    for viewport, filename in (
        (DESKTOP, "reference-desktop.png"),
        (MOBILE, "reference-mobile.png"),
    ):
        context: BrowserContext | None = None
        try:
            context = browser.new_context(viewport=viewport)
            context.route(
                "**/*.{woff,woff2,ttf,otf}",
                lambda route: route.abort(),
            )
            page = context.new_page()
            load_page(page, reference_url, timeout=30_000)
            page.screenshot(path=str(output / filename), full_page=True)
            evidence["captures"].append(filename)
        except Exception as exc:  # Reference availability must not block local QA.
            errors.append(f"{filename}: {exc}")
        finally:
            if context is not None:
                context.close()
    if errors:
        evidence["error"] = "; ".join(errors)
    return evidence


def run_desktop(browser: Browser, url: str, output: Path, failures: list[str]) -> dict[str, Any]:
    errors: list[str] = []
    context = browser.new_context(viewport=DESKTOP)
    page = context.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    try:
        load_page(page, url)
        reveal_page(page)
        page.screenshot(path=str(output / "local-desktop.png"), full_page=True)
        before_pointer = transform_snapshot(page)
        page.mouse.move(1350, 300)
        page.wait_for_timeout(350)
        after_pointer = transform_snapshot(page)

        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(100)
        before_scroll = transform_snapshot(page)
        page.evaluate("window.scrollTo(0, Math.min(900, document.documentElement.scrollHeight))")
        page.wait_for_timeout(350)
        after_scroll = transform_snapshot(page)
        metrics = page_metrics(page, errors)
        if errors:
            failures.append(f"desktop console/page errors: {errors}")
        if metrics["scrollWidth"] > metrics["clientWidth"] + 1:
            failures.append("desktop horizontal overflow")
        return {
            "metrics": metrics,
            "pointer": {"before": before_pointer, "after": after_pointer},
            "scroll": {"before": before_scroll, "after": after_scroll},
        }
    except Exception as exc:
        failures.append(f"desktop navigation/check failed: {exc}")
        return {"error": str(exc), "consoleErrors": errors}
    finally:
        context.close()


def run_viewport(
    browser: Browser,
    url: str,
    output: Path,
    viewport: dict[str, int],
    label: str,
    failures: list[str],
    *,
    is_mobile: bool = False,
) -> dict[str, Any]:
    """Capture a responsive viewport and exercise both public rails."""
    errors: list[str] = []
    context = browser.new_context(
        viewport=viewport,
        is_mobile=is_mobile,
        has_touch=is_mobile,
    )
    page = context.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    try:
        load_page(page, url)
        reveal_page(page)
        page.screenshot(path=str(output / f"local-{label}.png"), full_page=True)
        metrics = page_metrics(page, errors)
        if errors:
            failures.append(f"{label} console/page errors: {errors}")
        if metrics["scrollWidth"] > metrics["clientWidth"] + 1:
            failures.append(f"{label} horizontal overflow")

        rails: dict[str, dict[str, int | None]] = {}
        for rail_id in ("featured-projects-rail", "featured-awards-rail"):
            rail = page.locator(f"#{rail_id}")
            if not rail.count():
                continue
            before = rail.evaluate("(element) => element.scrollLeft")
            rail.focus()
            page.keyboard.press("End")
            page.wait_for_timeout(150)
            after = rail.evaluate("(element) => element.scrollLeft")
            scroll_width = rail.evaluate("(element) => element.scrollWidth")
            client_width = rail.evaluate("(element) => element.clientWidth")
            rails[rail_id] = {"before": before, "afterEndKey": after}
            if scroll_width > client_width + 1 and after <= before:
                failures.append(f"{label} {rail_id} End key did not advance rail")

        return {"metrics": metrics, "rails": rails}
    except Exception as exc:
        failures.append(f"{label} navigation/check failed: {exc}")
        return {"error": str(exc), "consoleErrors": errors}
    finally:
        context.close()


def run_mobile(browser: Browser, url: str, output: Path, failures: list[str]) -> dict[str, Any]:
    errors: list[str] = []
    context = browser.new_context(viewport=MOBILE, is_mobile=True, has_touch=True)
    page = context.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    try:
        load_page(page, url)
        reveal_page(page)
        page.screenshot(path=str(output / "local-mobile.png"), full_page=True)
        metrics = page_metrics(page, errors)
        if errors:
            failures.append(f"mobile console/page errors: {errors}")
        if metrics["scrollWidth"] > metrics["clientWidth"] + 1:
            failures.append("mobile horizontal overflow")
        rail_results: dict[str, dict[str, int | None]] = {}
        for rail_id in ("featured-projects-rail", "featured-awards-rail"):
            rail = page.locator(f"#{rail_id}")
            if not rail.count():
                continue
            rail_before = rail.evaluate("(element) => element.scrollLeft")
            rail.focus()
            page.keyboard.press("End")
            page.wait_for_timeout(150)
            rail_after = rail.evaluate("(element) => element.scrollLeft")
            rail_scroll_width = rail.evaluate("(element) => element.scrollWidth")
            rail_client_width = rail.evaluate("(element) => element.clientWidth")
            rail_results[rail_id] = {"before": rail_before, "afterEndKey": rail_after}
            if rail_scroll_width > rail_client_width + 1 and rail_after <= rail_before:
                failures.append(f"mobile {rail_id} End key did not advance rail")
        return {
            "metrics": metrics,
            "rails": rail_results,
            "orientationControlCount": page.get_by_role("button", name="启用动态玻璃").count(),
        }
    except Exception as exc:
        failures.append(f"mobile navigation/check failed: {exc}")
        return {"error": str(exc), "consoleErrors": errors}
    finally:
        context.close()


def run_orientation(browser: Browser, url: str, output: Path) -> dict[str, Any]:
    """Mock the iOS permission branch and verify synthetic sensor input.

    Mobile contexts provide a coarse pointer, so the control remains hidden on
    real desktop browsers while this explicit test can exercise the branch.
    """
    context = browser.new_context(viewport=MOBILE, is_mobile=True, has_touch=True)
    context.add_init_script(
        """
        (() => {
          function DeviceOrientationEvent() {}
          DeviceOrientationEvent.requestPermission = () => Promise.resolve('granted');
          Object.defineProperty(window, 'DeviceOrientationEvent', { configurable: true, writable: true, value: DeviceOrientationEvent });
        })();
        """
    )
    page = context.new_page()
    result: dict[str, Any] = {"controlVisible": False, "granted": False, "varsBefore": None, "varsAfter": None}
    try:
        load_page(page, url)
        button = page.get_by_role("button", name="启用动态玻璃")
        result["controlVisible"] = button.count() > 0
        if not result["controlVisible"]:
            return result
        button.click()
        page.wait_for_timeout(150)
        result["granted"] = page.get_by_role("status", name="动态玻璃已启用").count() > 0
        result["varsBefore"] = transform_snapshot(page)
        page.evaluate(
            """
            () => {
              const first = new Event('deviceorientation');
              Object.defineProperties(first, { beta: { value: 0 }, gamma: { value: 0 } });
              window.dispatchEvent(first);
              const second = new Event('deviceorientation');
              Object.defineProperties(second, { beta: { value: 18 }, gamma: { value: 14 } });
              window.dispatchEvent(second);
            }
            """
        )
        page.wait_for_timeout(350)
        result["varsAfter"] = transform_snapshot(page)
        page.screenshot(path=str(output / "local-mobile-orientation.png"), full_page=True)
        return result
    finally:
        context.close()


def run_reduced(browser: Browser, url: str, output: Path, failures: list[str]) -> dict[str, Any]:
    context = browser.new_context(viewport=DESKTOP, reduced_motion="reduce")
    page = context.new_page()
    errors: list[str] = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
    try:
        load_page(page, url)
        reveal_page(page)
        page.screenshot(path=str(output / "local-reduced-motion.png"), full_page=True)
        snapshot = transform_snapshot(page)
        metrics = page_metrics(page, errors)
        if errors:
            failures.append(f"reduced-motion console/page errors: {errors}")
        if snapshot["glassX"] not in {"", "0", "0.000"} or snapshot["glassY"] not in {"", "0", "0.000"}:
            failures.append("reduced-motion glass variables are not neutral")
        return {"snapshot": snapshot, "metrics": metrics}
    except Exception as exc:
        failures.append(f"reduced-motion check failed: {exc}")
        return {"error": str(exc)}
    finally:
        context.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="Local public-site URL, e.g. http://127.0.0.1:3000")
    parser.add_argument("--reference-url", default="https://cati.me/", help="Optional live/reference URL")
    parser.add_argument("--output-dir", required=True, help="Caller-owned temporary evidence directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output = Path(args.output_dir).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        evidence = {
            "localUrl": args.url,
            "reference": capture_reference(browser, args.reference_url, output),
            "desktop": run_desktop(browser, args.url, output, failures),
            "laptop": run_viewport(browser, args.url, output, LAPTOP, "laptop", failures),
            "tablet": run_viewport(browser, args.url, output, TABLET, "tablet", failures),
            "mobile": run_mobile(browser, args.url, output, failures),
            "orientation": run_orientation(browser, args.url, output),
            "reducedMotion": run_reduced(browser, args.url, output, failures),
            "failures": failures,
        }
        browser.close()
    write_json(output / "visual-qa.json", evidence)
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
