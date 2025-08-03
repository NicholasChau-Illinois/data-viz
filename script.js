document.addEventListener('DOMContentLoaded', init);

async function init() {
    const scenes = ['#scene-1', '#scene-2', '#scene-3'];
    let currentScene = 0;

    // Load data
    const globalData = await d3.csv("world_gdp.csv", d => ({
        Year: +d.Year,
        GDP: d.GDP === "" || isNaN(+d.GDP) ? null : +d.GDP
    }));

    const regionData = await d3.csv("region_gdp.csv", d => ({
        Region: d.Region,
        GDP: d.GDP === "" || isNaN(+d.GDP) ? null : +d.GDP
    }));

    const countryData = await d3.csv("gdp_csv.csv", d => ({
        Country: d.Country,
        Year: +d.Year,
        GDP: d.GDP === "" || isNaN(+d.GDP) ? null : +d.GDP
    }));

    // Log data to verify
    console.log("Global Data:", globalData);
    console.log("Region Data:", regionData);
    console.log("Country Data:", countryData);

    // Initial chart rendering
    updateChartForScene(currentScene);

    // Populate the dropdown menu with country options
    const countries = Array.from(new Set(countryData.map(d => d.Country)));
    const countrySelect = d3.select("#country-select");
    countrySelect.selectAll("option")
        .data(countries)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Add event listeners to buttons
    document.getElementById('next').addEventListener('click', () => {
        if (currentScene < scenes.length - 1) {
            d3.select(scenes[currentScene]).classed('active', false);
            currentScene++;
            d3.select(scenes[currentScene]).classed('active', true);
            updateChartForScene(currentScene);
        }
    });

    document.getElementById('previous').addEventListener('click', () => {
        if (currentScene > 0) {
            d3.select(scenes[currentScene]).classed('active', false);
            currentScene--;
            d3.select(scenes[currentScene]).classed('active', true);
            updateChartForScene(currentScene);
        }
    });

    d3.select("#country-select").on("change", function() {
        const selectedCountry = d3.select(this).property("value");
        updateCountryChart(selectedCountry);
    });

    function createLineChart(data) {
        console.log("Creating line chart..."); // Debugging
        // Clear existing SVG content
        d3.select("#line-chart").selectAll("*").remove();

        const svg = d3.select("#line-chart").append("svg")
            .attr("width", 800)
            .attr("height", 800);
        console.log("SVG created for line chart"); // Debugging
        const margin = { top: 20, right: 30, bottom: 150, left: 100 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        console.log("Width:", width, "Height:", height); // Debugging
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        console.log("Group element created for line chart"); // Debugging
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d.GDP), d3.max(data, d => d.GDP)])
            .range([height, 0]);
        console.log("X Domain:", d3.extent(data, d => new Date(d.Year, 0, 1))); // Debugging
        const line = d3.line()
            .x(d => x(new Date(d.Year, 0, 1)))
            .y(d => y(d.GDP));
        console.log("Line function created"); // Debugging
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
        
        g.append("g")
            .call(d3.axisLeft(y));
        console.log("Axes created for line chart"); // Debugging
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 1.5)
            .attr("d", line);
        console.log("Path created for line chart"); // Debugging
        // Annotation for 2008 Financial Crisis
        const crisisAnnotationData = data.find(d => d.Year === 2008);
        console.log("Crisis Annotation Data:", crisisAnnotationData); // Debugging
        if (crisisAnnotationData) {
            const crisisAnnotationX = x(new Date(2008, 0, 1));
            const crisisAnnotationY = y(crisisAnnotationData.GDP);
            console.log(`Crisis Annotation - X: ${crisisAnnotationX}, Y: ${crisisAnnotationY}`); // Debugging

            const annotations = [
                {
                    note: {
                        label: "2008 Financial Crisis Began",
                        align: "middle",
                        wrap: 200
                    },
                    x: crisisAnnotationX,
                    y: crisisAnnotationY,
                    dy: 60, // Adjust this to ensure the annotation is within the chart
                    dx: -30   // Adjust this to ensure the annotation is within the chart
                }
            ];

            const makeAnnotations = d3.annotation()
                .type(d3.annotationLabel)
                .annotations(annotations);

            g.append("g")
                .attr("class", "annotation-group")
                .call(makeAnnotations);
        } else {
            console.warn("No data found for 2008 to annotate.");
        }
    }

    function createRegionChart(data) {
        console.log("Creating region chart..."); // Debugging
        // Clear existing SVG content
        d3.select("#region-chart").selectAll("*").remove();

        const svg = d3.select("#region-chart").append("svg")
            .attr("width", 800)
            .attr("height", 800);

        const margin = { top: 20, right: 30, bottom: 150, left: 100 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(data.map(d => d.Region)).range([0, width]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.GDP)]).range([height, 0]);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g")
            .call(d3.axisLeft(y));

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.Region))
            .attr("y", d => y(d.GDP))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.GDP))
            .attr("fill", "green");
    }

    function createCountryChart(data) {
        console.log("Creating country chart..."); // Debugging
        console.log("Country Data:", data); // Debugging
        // Clear existing SVG content
        d3.select("#country-chart").selectAll("*").remove();
        
        const svg = d3.select("#country-chart").append("svg")
            .attr("width", 800)
            .attr("height", 800);
    
        const margin = { top: 20, right: 30, bottom: 150, left: 100 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
    
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
        const xDomain = d3.extent(data, d => new Date(d.Year, 0, 1));
        const yDomain = [d3.min(data, d => d.GDP), d3.max(data, d => d.GDP)];
    
        console.log("X Domain:", xDomain); // Debugging
        console.log("Y Domain:", yDomain); // Debugging
    
        const x = d3.scaleTime()
            .domain(xDomain)
            .range([0, width]);
    
        const y = d3.scaleLinear()
            .domain(yDomain)
            .range([height, 0]);
    
        const line = d3.line()
            .x(d => x(new Date(d.Year, 0, 1)))
            .y(d => y(d.GDP));
    
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        g.append("g")
            .call(d3.axisLeft(y));
    
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    
        // Annotation for 2008 financial crisis
        const crisisAnnotationData = data.find(d => d.Year === 2008);
        if (crisisAnnotationData) {
            const crisisAnnotationX = x(new Date(2008, 0, 1));
            const crisisAnnotationY = y(crisisAnnotationData.GDP);
            console.log(`2008 Annotation - X: ${crisisAnnotationX}, Y: ${crisisAnnotationY}`); // Debugging
    
            const annotations = [
                {
                    note: {
                        label: "2008 Financial Crisis Began",
                        align: "middle",
                        wrap: 200
                    },
                    x: crisisAnnotationX,
                    y: crisisAnnotationY,
                    dy: 60,  // Adjusted to ensure the annotation is within the chart
                    dx: -30  // Adjusted to ensure the annotation is within the chart
                }
            ];
    
            const makeAnnotations = d3.annotation()
                .type(d3.annotationLabel)
                .annotations(annotations);
    
            g.append("g")
                .attr("class", "annotation-group")
                .call(makeAnnotations);
        } else {
            console.warn("No data found for 2008 to annotate.");
        }
    }
    

    let defaultCountry = "World"; // Default country for third scene

    function updateChartForScene(sceneIndex) {
        if (sceneIndex === 0) {
            createLineChart(globalData);
        } else if (sceneIndex === 1) {
            createRegionChart(regionData);
        } else if (sceneIndex === 2) {
            updateCountryChart(defaultCountry); // Set default country
        }
    }

    function updateCountryChart(selectedCountry) {
        const filteredData = countryData.filter(d => d.Country === selectedCountry);
        createCountryChart(filteredData);
    }

}
