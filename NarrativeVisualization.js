d3.csv("/NetflixMoviesShows.csv").then(function(data) {

    //Use this variable to track the current scene index
    var currentSceneIndex = 0;
    const scenes = [
        {
            title: "Count of Movies and Shows per Release Year",
            description: "Drag the slider to show data for the selected range of release years!\nCheck tooltips to see exact release year and count of movies/shows.",
        },
        {
            title: "Count of Movies/Shows with each Rating per Release Year",
            description: "Drag the slider to show data for the selected range of release years!\nCheck tooltips to see exact release year, rating, and count of movies/shows with that rating.",
        },
        {
            title: "Count of Movies/Shows with Particular Duration per Release Year",
            description: "Drag the slider to show data for the selected range of release years!\nCheck tooltips to see exact release year, duration, and count of movies/shows with that duration.",
        }
    ];

    // Parse data
    data.forEach(d => {
        d.release_year = +d.release_year;
    });

    // Determine the range of release_year, get the min and max years in the data set
    const minYear = d3.min(data, d => d.release_year);
    const maxYear = d3.max(data, d => d.release_year);

    // Update the slider range based on the min and max years of the dataset
    const slider = d3.select("#yearSlider")
        .attr("min", minYear)
        .attr("max", maxYear)
        .attr("value", maxYear);

    d3.select("#sliderValue").text(maxYear);

    // Set dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 40 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Append SVG and group element
    const svg = d3.select("#chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select("#tooltip");

    // Function to clear the SVG
    function clearScene() {
        svg.selectAll("*").remove();
    }

    // Function to update scene 1 on chart based on filtered data
    function updateScene1(year) {
        clearScene();

        const scene = scenes[currentSceneIndex];
        d3.select("#chartTitle").text(scene.title);
        document.getElementById("chartSubHeading").innerHTML = (scene.description).replace(/\n/g, "<br>");

        // Initialize scales and axes
        const x = d3.scaleLinear().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y);

        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
        svg.append("g").attr("class", "y-axis");

        // Line generators
        const lineMovies = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.movies));

        const lineShows = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.shows));

        const filteredData = data.filter(d => d.release_year <= year);

        const counts = d3.rollup(filteredData, v => v.length, d => d.release_year, d => d.type);
        const countArray = Array.from(counts, ([key, value]) => ({ 
            year: key, 
            movies: value.get("Movie") || 0, 
            shows: value.get("TV Show") || 0 
        })).sort((a, b) => a.year - b.year);

        x.domain([d3.min(countArray, d => d.year), d3.max(countArray, d => d.year)]);
        y.domain([0, d3.max(countArray, d => Math.max(d.movies, d.shows))]);

        svg.selectAll(".x-axis").call(xAxis);
        svg.selectAll(".y-axis").call(yAxis);

        svg.selectAll(".line-movies").remove();
        svg.selectAll(".line-shows").remove();
        svg.selectAll(".tooltip-circle").remove();
        svg.selectAll(".annotation").remove();

        // Line paths
        svg.append("path")
            .datum(countArray)
            .attr("class", "line-movies line")
            .attr("d", lineMovies)
            .attr("stroke", "steelblue");

        svg.append("path")
            .datum(countArray)
            .attr("class", "line-shows line")
            .attr("d", lineShows)
            .attr("stroke", "orange");

        // Add circles to the line charts for tooltip data
        svg.selectAll(".tooltip-circle-movies")
            .data(countArray)
            .enter().append("circle")
            .attr("class", "tooltip-circle tooltip-circle-movies")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.movies))
            .attr("r", 3)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html(`Release Year: ${d.year}<br>Count of Movies: ${d.movies}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        svg.selectAll(".tooltip-circle-shows")
            .data(countArray)
            .enter().append("circle")
            .attr("class", "tooltip-circle tooltip-circle-shows")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.shows))
            .attr("r", 3)
            .attr("fill", "orange")
            .on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html(`Release Year: ${d.year}<br>Count of TV Shows: ${d.shows}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        // Add annotations
        const lastDataPoint = countArray[countArray.length - 1];

        svg.append("text")
            .attr("class", "annotation")
            .attr("x", x(lastDataPoint.year -5))
            .attr("y", y(lastDataPoint.movies))
            .attr("fill", "steelblue")
            .text("Movies");

        svg.append("text")
            .attr("class", "annotation")
            .attr("x", x(lastDataPoint.year -5))
            .attr("y", y(lastDataPoint.shows))
            .attr("fill", "orange")
            .text("TV Shows");

        // Add X axis title
        svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .style("font-size", "14px")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Release Year");

        // Add Y axis title
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "14px")
            .attr("transform", `rotate(-90)`)
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .text("Count of Type");

    }

    // Function to update scene 2 on chart based on filtered data
    function updateScene2(year) {
        clearScene();
        const scene = scenes[currentSceneIndex];
        d3.select("#chartTitle").text(scene.title);
        document.getElementById("chartSubHeading").innerHTML = (scene.description).replace(/\n/g, "<br>");

        // Initialize scales and axes
        const y = d3.scaleLinear().range([height, 0]);
        const x = d3.scaleLinear().range([0, width]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y);

        svg.append("g").attr("class", "y-axis");
        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);

        const filteredData = data.filter(d => d.release_year <= year);

        const counts = d3.rollup(filteredData, v => v.length, d => d.release_year, d => d.rating);
        const countArray = Array.from(counts, ([key, value]) => {
            const ratings = Array.from(value, ([rating, count]) => ({ rating, count }));
            return { year: key, ratings };
        }).sort((a, b) => a.year - b.year);

        x.domain([d3.min(countArray, d => d.year), d3.max(countArray, d => d.year)]);
        y.domain([0, d3.max(countArray, d => d3.max(d.ratings, r => r.count))]);

        svg.selectAll(".x-axis").call(xAxis);
        svg.selectAll(".y-axis").call(yAxis);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

         // Create a line generator
        const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.count));

        // Get all unique ratings
        const allRatings = Array.from(new Set(countArray.flatMap(d => d.ratings.map(r => r.rating))));

        // Draw lines for each rating
        allRatings.forEach(rating => {
            const ratingData = countArray.map(d => {
                const ratingCount = d.ratings.find(r => r.rating === rating)?.count || 0;
                return { year: d.year, count: ratingCount };
            });

            svg.append("path")
                .datum(ratingData)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", color(rating))
                .attr("stroke-width", 1.5)
                .attr("d", line);
        });

        countArray.forEach(yearData => {
            yearData.ratings.forEach(ratingData => {
                svg.append("circle")
                    .attr("class", "tooltip-circle")
                    .attr("r", 3)
                    .attr("fill", color(ratingData.rating))
                    .attr("cx", x(yearData.year))
                    .attr("cy", y(ratingData.count))
                    .on("mouseover", function(event) {
                        tooltip.style("display", "block")
                            .html(`Release Year: ${yearData.year}<br>Rating: ${ratingData.rating}<br>Count: ${ratingData.count}`)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`);
                    })
                    .on("mousemove", function(event) {
                        tooltip.style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`);
                    })
                    .on("mouseout", function() {
                        tooltip.style("display", "none");
                    });
            });
        });

        // Add annotations
        const lastDataPoint = countArray[countArray.length - 1];
        const lastRating = lastDataPoint.ratings[lastDataPoint.ratings.length - 1];

        svg.append("text")
            .attr("class", "annotation")
            .attr("x", x(lastDataPoint.year - 5))
            .attr("y", y(lastRating.count))   
            .attr("fill", color(lastRating.rating))
            .text(lastRating.rating);

        // Add X axis title
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .style("font-size", "14px")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .text("Release Year");

        // Add Y axis title
        svg.append("text")
            .attr("class", "axis-label")
            .attr("font-weight", "bold")
            .style("font-size", "14px")
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90)`)
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .text("Count of Movies/Shows with Rating");

    }

    // Function to update scene 3 on chart based on filtered data
    function updateScene3(year) {
        clearScene();
        const scene = scenes[currentSceneIndex];
        d3.select("#chartTitle").text(scene.title);
        document.getElementById("chartSubHeading").innerHTML = (scene.description).replace(/\n/g, "<br>");

        // Initialize scales and axes
        const y = d3.scaleLinear().range([height, 0]);
        const x = d3.scaleLinear().range([0, width]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y);

        svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
        svg.append("g").attr("class", "y-axis");

        // Filter data to include only TV Shows with seasons and up to the specified year
        const filteredData = data.filter(d => d.release_year <= year && d.duration.includes('Season'));

        // Extract the number of seasons from the duration string
        filteredData.forEach(d => {
            d.season_count = parseInt(d.duration.match(/\d+/)[0]);
        });

        // Aggregate data: count the number of shows per season count per release year
        const counts = d3.rollup(filteredData, v => v.length, d => d.release_year, d => d.season_count);

        // Transform data into an array of objects for easier manipulation
        const countArray = Array.from(counts, ([key, value]) => {
            const seasons = Array.from(value, ([season, count]) => ({ season, count }));
            return { year: key, seasons };
        }).sort((a, b) => a.year - b.year);

        x.domain([d3.min(countArray, d => d.year), d3.max(countArray, d => d.year)]);
        y.domain([0, d3.max(countArray, d => d3.max(d.seasons, s => s.count))]);

        svg.selectAll(".x-axis").call(xAxis);
        svg.selectAll(".y-axis").call(yAxis);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create a line generator
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.count));

        // Get all the unique season counts
        const allSeasons = Array.from(new Set(countArray.flatMap(d => d.seasons.map(s => s.season))));

        // Draw lines for each of the season counts
        allSeasons.forEach(season => {
            const seasonData = countArray.map(d => {
                const seasonCount = d.seasons.find(s => s.season === season)?.count || 0;
                return { year: d.year, count: seasonCount };
            });

            svg.append("path")
                .datum(seasonData)
                .attr("class", "line")
                .attr("stroke", color(season))
                .attr("stroke-width", 1.5)
                .attr("fill", "none")
                .attr("d", line);
        });

        // Add circles for each data point for tooltip
        countArray.forEach(yearData => {
            yearData.seasons.forEach(seasonData => {
                svg.append("circle")
                    .attr("class", "tooltip-circle")
                    .attr("cx", x(yearData.year))
                    .attr("cy", y(seasonData.count))
                    .attr("r", 3)
                    .attr("fill", color(seasonData.season))
                    .on("mouseover", function(event) {
                        tooltip.style("display", "block")
                            .html(`Release Year: ${yearData.year}<br>Season: ${seasonData.season}<br>Count: ${seasonData.count}`)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`);
                    })
                    .on("mousemove", function(event) {
                        tooltip.style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 28}px`);
                    })
                    .on("mouseout", function() {
                        tooltip.style("display", "none");
                    });
            });
        });

        // Add X axis title
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("font-weight", "bold")
            .style("font-size", "14px")
            .text("Release Year");

        // Add Y axis title
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", `rotate(-90)`)
            .attr("x", -height / 2)
            .attr("y", -margin.left + 10)
            .attr("font-weight", "bold")
            .style("font-size", "14px")
            .text("Count of Movies/Shows with Duration");
    }

    // Display the initial chart
    function updateScene(currentSceneIndex, year)  {
        if (currentSceneIndex == 0){
            updateScene1(year);
        } else if (currentSceneIndex == 1){
            updateScene2(year);
        } else if (currentSceneIndex == 2){
            updateScene3(year);
        }

        // Disable prevButton if on first scene, and disable nextButton if on last scene.
        const nextButton = document.getElementById('nextButton');
        if (currentSceneIndex < scenes.length - 1) {
            nextButton.disabled = false;
        } else {
            nextButton.disabled = true;
        }

        const prevButton = document.getElementById('prevButton');
        if (currentSceneIndex > 0) {
            prevButton.disabled = false;
        } else {
            prevButton.disabled = true;
        }

    }
    updateScene(currentSceneIndex, maxYear);

    var sliderYear = maxYear;

    // Update the chart when the slider release year value changes
    slider.on("input", function() {
        sliderYear = +this.value;
        d3.select("#sliderValue").text(sliderYear);
        updateScene(currentSceneIndex, sliderYear);
    });

    // Events on click of buttons
    d3.select("#nextButton").on("click", () => {
        if (currentSceneIndex < scenes.length - 1) {
            currentSceneIndex++;
            updateScene(currentSceneIndex, sliderYear);
        }
    });

    d3.select("#prevButton").on("click", () => {
        if (currentSceneIndex > 0) {
            currentSceneIndex--;
            updateScene(currentSceneIndex, sliderYear);
        }
    });
});
