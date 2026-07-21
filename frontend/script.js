/* ==========================================================
   Atlas Agent - script.js
   UI interactions only (NO CHAT LOGIC)
========================================================== */

(function () {
    "use strict";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ==========================================================
       Mobile Navigation
    ========================================================== */

    const menu = document.getElementById("menu");
    const links = document.getElementById("links");

    if (menu && links) {
        menu.addEventListener("click", () => {
            links.classList.toggle("open");
            menu.classList.toggle("active");
            menu.setAttribute(
                "aria-expanded",
                links.classList.contains("open")
            );
        });

        links.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                links.classList.remove("open");
                menu.classList.remove("active");
                menu.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* ==========================================================
       Current Year
    ========================================================== */

    const yr = document.getElementById("yr");

    if (yr) {
        yr.textContent = new Date().getFullYear();
    }

    /* ==========================================================
       Copy Buttons
    ========================================================== */

    document.querySelectorAll(".cp").forEach(button => {

        button.addEventListener("click", async () => {

            const text = button.dataset.cp;

            if (!text) return;

            try {

                await navigator.clipboard.writeText(text);

            } catch {

                const textarea = document.createElement("textarea");

                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";

                document.body.appendChild(textarea);

                textarea.select();

                document.execCommand("copy");

                textarea.remove();
            }

            button.classList.add("ok");

            setTimeout(() => {

                button.classList.remove("ok");

            }, 1200);

        });

    });

    /* ==========================================================
       Scroll Reveal
    ========================================================== */

    if (!reduced && "IntersectionObserver" in window) {

        const observer = new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("show");

                    observer.unobserve(entry.target);

                }

            });

        }, {
            threshold: 0.08
        });

        document.querySelectorAll(".rv").forEach((el, index) => {

            el.style.transitionDelay = `${(index % 10) * 60}ms`;

            observer.observe(el);

        });

    } else {

        document.querySelectorAll(".rv").forEach(el => {

            el.classList.add("show");

        });

    }

    /* ==========================================================
       Navbar Blur on Scroll
    ========================================================== */

    const nav = document.querySelector("nav");

    if (nav) {

        window.addEventListener("scroll", () => {

            nav.style.background =
                window.scrollY > 40
                    ? "rgba(10,10,10,.90)"
                    : "rgba(10,10,10,.55)";

        });

    }

    /* ==========================================================
       GitHub Repository Stats
    ========================================================== */

    function set(id, value) {

        const el = document.getElementById(id);

        if (el) el.textContent = value;

    }

    async function loadGithubStats() {

        const url = "https://api.github.com/repos/ather-ops/atlas-agent";

        try {

            const repo = await fetch(url);

            const data = await repo.json();

            set("gh-stars", data.stargazers_count ?? "—");
            set("gh-lang", data.language ?? "—");

        } catch {

            set("gh-stars", "—");
            set("gh-lang", "—");

        }

        try {

            const release = await fetch(url + "/releases/latest");

            if (release.ok) {

                const rel = await release.json();

                set("gh-release", rel.tag_name);

            } else {

                set("gh-release", "None");

            }

        } catch {

            set("gh-release", "—");

        }

    }

    const repoCard = document.getElementById("repo");

    if (repoCard && "IntersectionObserver" in window) {

        const repoObserver = new IntersectionObserver(entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    loadGithubStats();

                    repoObserver.disconnect();

                }

            });

        });

        repoObserver.observe(repoCard);

    }

})();