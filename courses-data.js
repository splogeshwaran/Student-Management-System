/* Shared Coursera catalog for the course page and course assistant. */
(function () {
    var endpoint = "/api/courses";

    var pageSize = 24;
    var nextStart = 0;
    var hasMore = true;
    var pendingRequest = null;

    window.COURSES = [];
    window.COURSES_HAS_MORE = true;
    window.COURSE_TOTAL = null;

    function mapCourse(course, partners) {
        var providerNames = (course.partnerIds || [])
            .map(function (id) { return partners[id]; })
            .filter(Boolean);

        return {
            code: course.id,
            name: course.name || "Untitled course",
            duration: course.workload || "Self-paced",
            faculty: providerNames.length ? providerNames.join(", ") : "Coursera",
            path: [],
            description: course.description || "",
            photoUrl: course.photoUrl || "",
            url: course.slug ? "https://www.coursera.org/learn/" + encodeURIComponent(course.slug) : ""
        };
    }

    window.loadMoreCourses = function () {
        if (pendingRequest) return pendingRequest;
        if (!hasMore) return Promise.resolve([]);

        var params = new URLSearchParams({
            limit: String(pageSize),
            start: String(nextStart),
            fields: "name,slug,photoUrl,description,workload,partnerIds,courseType",
            includes: "partnerIds"
        });

        pendingRequest = fetch(endpoint + "?" + params.toString())
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Coursera returned HTTP " + response.status + ".");
                }
                return response.json();
            })
            .then(function (data) {
                if (!data || !Array.isArray(data.elements)) {
                    throw new Error("Coursera returned an invalid course catalog.");
                }

                var partners = {};
                var linkedPartners = data.linked && data.linked["partners.v1"] || [];
                linkedPartners.forEach(function (partner) {
                    partners[partner.id] = partner.name;
                });

                var added = data.elements.map(function (course) {
                    return mapCourse(course, partners);
                });
                Array.prototype.push.apply(window.COURSES, added);

                var next = data.paging && data.paging.next;
                var parsedNext = Number(next);
                hasMore = next !== undefined && next !== null && next !== "" &&
                    Number.isFinite(parsedNext) && added.length > 0;
                if (hasMore) nextStart = parsedNext;
                window.COURSES_HAS_MORE = hasMore;
                window.COURSE_TOTAL = data.paging && Number(data.paging.total) || null;

                return added;
            })
            .finally(function () {
                pendingRequest = null;
            });

        return pendingRequest;
    };

    window.COURSES_READY = window.loadMoreCourses();
})();
