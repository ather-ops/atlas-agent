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
            const isOpen = links.style.display === 'flex';
            links.style.display = isOpen ? 'none' : 'flex';
            if (links.style.display === 'flex') {
                links.style.flexDirection = 'column';
                links.style.gap = '1rem';
                links.style.marginTop = '0.5rem';
            }
            menu.setAttribute(
                "aria-expanded",
                links.style.display === 'flex'
            );
        });

        links.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                links.style.display = 'none';
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

            const orig = button.innerHTML;
            button.innerHTML = '✓';
            setTimeout(() => {
                button.innerHTML = orig;
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
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.08
        });

        document.querySelectorAll(".rv").forEach((el, index) => {
            el.style.transitionDelay = `${(index % 10) * 60}ms`;
            el.style.opacity = '0';
            el.style.transform = 'translateY(1.2rem)';
            el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
            observer.observe(el);
        });
    } else {
        document.querySelectorAll(".rv").forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
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
                    ? "rgba(0,0,0,0.95)"
                    : "rgba(0,0,0,0.85)";
        });
    }

    /* ==========================================================
       GitHub Repository Stats
    ========================================================== */

    function setElementText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    async function loadGithubStats() {
        const url = "https://api.github.com/repos/ather-ops/atlas-agent";

        try {
            const repo = await fetch(url);
            const data = await repo.json();
            setElementText("gh-stars", data.stargazers_count ?? "2+");
            setElementText("gh-lang", data.language ?? "Python");
        } catch {
            setElementText("gh-stars", "2+");
            setElementText("gh-lang", "Python");
        }

        try {
            const release = await fetch(url + "/releases/latest");
            if (release.ok) {
                const rel = await release.json();
                setElementText("gh-release", rel.tag_name);
            } else {
                setElementText("gh-release", "v0.1.0");
            }
        } catch {
            setElementText("gh-release", "v0.1.0");
        }

        setElementText("gh-commits", "30+");
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
        }, { threshold: 0.1 });
        repoObserver.observe(repoCard);
    } else if (repoCard) {
        loadGithubStats();
    }

    /* ==========================================================
       Smooth Scroll for Anchor Links
    ========================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    console.log('UI interactions initialized');

})();