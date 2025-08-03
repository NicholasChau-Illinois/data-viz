document.addEventListener('DOMContentLoaded', init);

async function init() {
    const scenes = ['#scene-1', '#scene-2', '#scene-3'];
    let currentScene = 0;

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

    const countries = Array.from(new Set(countryData.map(d => d.Country)));
    const countrySelect = d3.select("#country-select");
    countrySelect.selectAll("option")
        .data(countries)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

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

    function applyChartStyling(svg) {
        svg.style("background-color", "#f9f9f9");

        svg.selectAll(".axis line, .axis path")
            .style("stroke", "#333")
            .style("shape-rendering", "crispEdges");

        svg.selectAll("text")
            .style("font-family", "'Segoe UI', sans-serif")
            .style("fill", "#333");
    }

    function createLineChart(data) {
        d3.select("#line-chart").selectAll("*").remove();
        const svg = d3.select("#line-chart").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 50, right: 30, bottom: 150, left: 100 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.Year, 0, 1))).range([0, width]);
        const y = d3.scaleLinear().domain([d3.min(data, d => d.GDP), d3.max(data, d => d.GDP)]).range([height, 0]);
        const line = d3.line().x(d => x(new Date(d.Year, 0, 1))).y(d => y(d.GDP));

        g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"))).selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g").call(d3.axisLeft(y));
        g.append("path").datum(data)
            .attr("fill", "none")
            .attr("stroke", "#28a745")
            .attr("stroke-width", 2.5)
            .attr("d", line);

        const crisisAnnotationData = data.find(d => d.Year === 2008);
        if (crisisAnnotationData) {
            const annotations = [{
                note: { label: "2008 Financial Crisis", align: "middle", wrap: 150 },
                x: x(new Date(2008, 0, 1)),
                y: y(crisisAnnotationData.GDP),
                dy: -40,
                dx: -30
            }];
            const makeAnnotations = d3.annotation().type(d3.annotationLabel).annotations(annotations);
            g.append("g").attr("class", "annotation-group").call(makeAnnotations);
        }

        applyChartStyling(svg);
    }

    function createRegionChart(data) {
        d3.select("#region-chart").selectAll("*").remove();
        const svg = d3.select("#region-chart").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 50, right: 30, bottom: 150, left: 100 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(data.map(d => d.Region)).range([0, width]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.GDP)]).range([height, 0]);

        g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g").call(d3.axisLeft(y));
        g.selectAll(".bar").data(data).enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.Region))
            .attr("y", d => y(d.GDP))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.GDP))
            .attr("fill", "#17a2b8");

        applyChartStyling(svg);
    }

    function createCountryChart(data) {
        d3.select("#country-chart").selectAll("*").remove();
        const svg = d3.select("#country-chart").append("svg")
            .attr("width", 800)
            .attr("height", 600);

        const margin = { top: 50, right: 30, bottom: 150, left: 100 };
        const width = 800 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().domain(d3.extent(data, d => new Date(d.Year, 0, 1))).range([0, width]);
        const y = d3.scaleLinear().domain([d3.min(data, d => d.GDP), d3.max(data, d => d.GDP)]).range([height, 0]);

        const line = d3.line().x(d => x(new Date(d.Year, 0, 1))).y(d => y(d.GDP));

        g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y"))).selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g").call(d3.axisLeft(y));

        g.append("path").datum(data)
            .attr("fill", "none")
            .attr("stroke", "#ffc107")
            .attr("stroke-width", 2.5)
            .attr("d", line);

        const crisisAnnotationData = data.find(d => d.Year === 2008);
        if (crisisAnnotationData) {
            const annotations = [{
                note: { label: "2008 Financial Crisis", align: "middle", wrap: 150 },
                x: x(new Date(2008, 0, 1)),
                y: y(crisisAnnotationData.GDP),
                dy: -40,
                dx: -30
            }];
            const makeAnnotations = d3.annotation().type(d3.annotationLabel).annotations(annotations);
            g.append("g").attr("class", "annotation-group").call(makeAnnotations);
        }

        applyChartStyling(svg);
    }

    function updateChartForScene(sceneIndex) {
        if (sceneIndex === 0) createLineChart(globalData);
        else if (sceneIndex === 1) createRegionChart(regionData);
        else if (sceneIndex === 2) updateCountryChart("World");
    }

    function updateCountryChart(selectedCountry) {
        const filteredData = countryData.filter(d => d.Country === selectedCountry);
        createCountryChart(filteredData);
    }
}
