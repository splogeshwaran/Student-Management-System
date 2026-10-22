/* Course assistant. Uses the shared Coursera catalog and enrollment list. */
(function () {
    var AI_ENDPOINT = "";
    var courses = window.COURSES || [];
    var history = [];
    var catalogReady = !window.COURSES_READY;
    var catalogUnavailable = false;
    var stopWords = [
        "a", "about", "all", "an", "and", "are", "available", "beginner",
        "can", "course", "courses", "details", "do", "for", "give", "help",
        "i", "in", "is", "me", "more", "my", "of", "on", "please", "recommend",
        "should", "similar", "suggest", "take", "tell", "the", "what", "which",
        "who", "with"
    ];

    if (window.COURSES_READY) {
        window.COURSES_READY.then(function () {
            catalogReady = true;
        }).catch(function () {
            catalogUnavailable = true;
        });
    }

    function enrolled() {
        try {
            var stored = JSON.parse(localStorage.getItem("courses"));
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            return [];
        }
    }

    var root = document.createElement("div");
    root.id = "chatbot";
    root.innerHTML =
        '<button type="button" class="chat-fab" aria-label="Open course assistant" aria-expanded="false">💬 Chat with us</button>' +
        '<section class="chat-panel" aria-label="Course assistant" hidden>' +
        '<header class="chat-head"><span>Course assistant</span><button type="button" class="chat-close" aria-label="Close assistant">×</button></header>' +
        '<div class="chat-log" role="log" aria-live="polite" aria-relevant="additions text"></div>' +
        '<div class="chat-chips" aria-label="Suggested questions"></div>' +
        '<form class="chat-form"><input type="text" aria-label="Ask the course assistant" placeholder="Ask about courses…" autocomplete="off" required><button type="submit">Send</button></form>' +
        '</section>';
    document.body.appendChild(root);

    var fab = root.querySelector(".chat-fab");
    var panel = root.querySelector(".chat-panel");
    var log = root.querySelector(".chat-log");
    var form = root.querySelector(".chat-form");
    var input = form.querySelector("input");
    var chips = root.querySelector(".chat-chips");

    function add(text, who) {
        var el = document.createElement("div");
        el.className = "msg " + who;
        el.textContent = text;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
    }

    [
        ["List courses", "What courses are available?"],
        ["Recommend a course", "Recommend a course for me"],
        ["My enrollments", "Show my enrolled courses"],
        ["What can you do?", "Help"]
    ].forEach(function (suggestion) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = suggestion[0];
        button.addEventListener("click", function () { send(suggestion[1]); });
        chips.appendChild(button);
    });

    function toggle(open) {
        panel.hidden = !open;
        fab.hidden = open;
        fab.setAttribute("aria-expanded", String(open));
        if (open) {
            if (!log.children.length) {
                add("Hi! I can find courses by topic, explain a course, compare workload and providers, or help you enroll.", "bot");
            }
            input.focus();
        } else {
            fab.focus();
        }
    }

    fab.addEventListener("click", function () { toggle(true); });
    root.querySelector(".chat-close").addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !panel.hidden) toggle(false);
    });
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var text = input.value.trim();
        if (text) send(text);
        input.value = "";
    });

    function send(text) {
        add(text, "user");
        history.push({ role: "user", content: text });
        var pending = add("Thinking…", "bot");

        function done(reply) {
            pending.textContent = reply;
            history.push({ role: "assistant", content: reply });
            log.scrollTop = log.scrollHeight;
        }

        if (!AI_ENDPOINT) return done(answer(text));

        fetch(AI_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: history, courses: courses, enrolled: enrolled() })
        })
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function (data) {
                if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
                    throw new Error("The assistant returned an empty reply.");
                }
                done(data.reply.trim());
            })
            .catch(function (error) {
                done("The AI service is unavailable (" + error.message + "). Here's what I can do offline: " + answer(text));
            });
    }

    function words(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/)
            .filter(function (word) {
                return word.length > 2 && stopWords.indexOf(word) === -1;
            });
    }

    function rankCourses(query) {
        var queryWords = words(query);
        var normalizedQuery = query.toLowerCase();

        return courses.map(function (course, index) {
            var name = (course.name || "").toLowerCase();
            var code = (course.code || "").toLowerCase();
            var faculty = (course.faculty || "").toLowerCase();
            var description = (course.description || "").toLowerCase();
            var score = 0;

            if (name && normalizedQuery.indexOf(name) !== -1) score += 30;
            if (code && normalizedQuery.indexOf(code) !== -1) score += 40;

            queryWords.forEach(function (word) {
                if (name.indexOf(word) !== -1) score += 5;
                if (faculty.indexOf(word) !== -1) score += 3;
                if (description.indexOf(word) !== -1) score += 1;
            });

            return { course: course, score: score, index: index };
        }).filter(function (match) {
            return match.score > 0;
        }).sort(function (left, right) {
            return right.score - left.score || left.index - right.index;
        });
    }

    function catalogStatus() {
        if (catalogUnavailable) {
            return "I couldn't load the Coursera catalog. Please try again from the Courses page.";
        }
        return "The Coursera catalog is still loading. Please try again in a moment.";
    }

    function enroll(course) {
        var list = enrolled();
        if (list.indexOf(course.name) !== -1) {
            return "You're already enrolled in " + course.name + ".";
        }

        list.push(course.name);
        try {
            localStorage.setItem("courses", JSON.stringify(list));
        } catch (error) {
            return "I couldn't save your enrollment in this browser. Please check that site storage is enabled and try again.";
        }

        document.querySelectorAll(".course-card").forEach(function (card) {
            var name = card.querySelector(".course-name");
            var button = card.querySelector(".coursebtn");
            if (name && button && name.textContent === course.name) {
                button.textContent = "Enrolled";
                button.classList.add("enrolled");
            }
        });
        return "You're enrolled in " + course.name + ".";
    }

    function answer(text) {
        var query = text.toLowerCase().trim();
        var mine = enrolled();
        var wantsEnroll = /enrol|join|sign me up/.test(query);
        var wantsList = /available|list|show|what.*course|which.*course/.test(query) &&
            !/which course should i/.test(query);
        var wantsRecommendation = /\b(recommend|suggest)\b|\bwhich course should i\b|\bwhat should i (take|learn)\b|\bbeginner\b|\bwhere should i start\b/.test(query);
        var catalogQuestion = /course|available|offer|list|catalog/.test(query);

        if (/^(hi|hello|hey)\b/.test(query)) {
            return "Hello! Tell me what you want to learn, or ask me to list courses, compare workloads, or show your enrollments.";
        }
        if (/^(help|what can you do|what do you do)\??$/.test(query)) {
            return "I can list available courses, recommend courses by topic, explain a course's overview/provider/workload, show your enrollments, and enroll you. Try “recommend a course for data science”.";
        }
        if (/thank(s| you)?\b/.test(query)) return "You're welcome! Tell me what you'd like to learn next.";
        if (!catalogReady && !courses.length && catalogQuestion) return catalogStatus();
        if (catalogUnavailable && !courses.length && catalogQuestion) return catalogStatus();

        if (/my (enrolled )?courses|enrolled|my enrollments/.test(query)) {
            return mine.length
                ? "You're enrolled in:\n" + mine.map(function (name) { return "• " + name; }).join("\n")
                : "You haven't enrolled in a course yet. Tell me a topic you're interested in and I'll look for a match.";
        }

        if (wantsRecommendation) {
            var matches = rankCourses(query).slice(0, 3);
            if (!matches.length) {
                return "What would you like to learn—such as programming, data science, business, or design? I'll match that to the available course titles and descriptions.";
            }
            return "Based on the topics and course descriptions, these are the closest matches:\n" +
                matches.map(function (match, index) {
                    return (index + 1) + ". " + match.course.name + " (" + match.course.duration + ")";
                }).join("\n") +
                "\nAsk me about one of these for its provider or course overview.";
        }

        if (wantsList) {
            if (!courses.length) return catalogStatus();
            return "I can see " + (window.COURSE_TOTAL || courses.length).toLocaleString() +
                " Coursera courses. Here are some currently loaded:\n" +
                courses.slice(0, 10).map(function (course) {
                    return "• " + course.name + " (" + course.duration + ")";
                }).join("\n") +
                (courses.length > 10 ? "\nAsk me about a topic to narrow the list." : "");
        }

        var courseMatch = rankCourses(query)[0];
        var course = courseMatch && courseMatch.course;
        if (wantsEnroll) {
            return course
                ? enroll(course)
                : "Which course would you like to enroll in? Include its name and I'll find it.";
        }
        if (course) {
            if (/provider|faculty|teacher|who teaches|instructor|taught/.test(query)) {
                return course.name + " is offered by " + course.faculty + ".";
            }
            if (/long|duration|workload|weeks|time|hours/.test(query)) {
                return course.name + " has a listed workload of " + course.duration + ".";
            }
            if (/overview|description|syllabus|learn|topic|cover|about/.test(query)) {
                return course.name + " overview: " +
                    (course.description || "No detailed course overview is available from Coursera.");
            }
            return course.name + " is offered by " + course.faculty + " and has a listed workload of " +
                course.duration + ". Ask me for its overview, or say “enroll me in " + course.name + "”.";
        }

        return "I couldn't match that to a course yet. Try a course name, topic (like data science), or ask “What courses are available?”";
    }
})();
