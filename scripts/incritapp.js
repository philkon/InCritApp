$(document).ready(function(){
    $("#browse-button").on("click", function(e) {
        $("#file-reader").click();
    });

    $("#file-reader").on('change', function(e) {
        $("#file-name").val(this.files[0].name)
        readFile(this.files[0], function(e) {
            var parsed_JSON = JSON.parse(e.target.result)
            witnesses = parsed_JSON.witnesses
            text_starts = parsed_JSON.text_starts
            text_titles = parsed_JSON.text_titles
            chapter_starts = parsed_JSON.chapter_starts
            attribute_names = parsed_JSON.attribute_names
            attribute_values = {}
            var table = parsed_JSON.table
            $("#num-texts").html(text_starts.length)
            $("#num-chapters").html(chapter_starts.length)
            $("#num-words").html(table.length)
            $("#num-witnesses").html(witnesses.length)
            for(var row_idx = 0; row_idx < table.length; row_idx++){
                var cur_row = table[row_idx]
                var temp_attribute_values = {}
                for (var key in attribute_names) {
                    temp_attribute_values[key] = {}
                }
                for(var wit_idx = 0; wit_idx < cur_row.length; wit_idx++){
                    if (cur_row[wit_idx].length > 0) {
                        var cur_wit = cur_row[wit_idx][0]
                        for (var key in cur_wit) {
                            temp_attribute_values[key][witnesses[wit_idx]] = cur_wit[key]
                        }
                     } else {
                        for (var key in temp_attribute_values) {
                            temp_attribute_values[key][witnesses[wit_idx]] = "empty"
                        }
                    }
                }
                for (var key in temp_attribute_values) {
                    if (!(key in attribute_values)) {
                        attribute_values[key] = []
                    }
                    attribute_values[key].push(temp_attribute_values[key])
                }
            }
            getOverview()
        })
    })
})

function readFile(file, callback){
    var reader = new FileReader();
    reader.onload = callback
    reader.readAsText(file);
}

function getOverview() {
    var table_values = {"chapter": [], "words": [], "empty": [], "text_title": []}
    for (attr_name in attribute_names) {
        table_values[attr_name] = []
    }
    var words_min_value = Number.MAX_SAFE_INTEGER
    var words_max_value = 0
    var empty_min_value = Number.MAX_SAFE_INTEGER
    var empty_max_value = 0
    var attr_min_values = {}
    var attr_max_values = {}
    for (attr_name in attribute_names) {
        attr_min_values[attr_name] = Number.MAX_SAFE_INTEGER
        attr_max_values[attr_name] = 0
    }
    for (var chapter_idx = 0; chapter_idx < chapter_starts.length; chapter_idx++) {
        var chapter_start = chapter_starts[chapter_idx]
        if (chapter_idx == chapter_starts.length - 1) {
            var chapter_end = attribute_values.t.length
        } else {
            var chapter_end = chapter_starts[chapter_idx + 1]
        }
        if (text_starts.includes(chapter_start)) {
            var chapter_num = 1
            var text_title = text_titles[text_starts.indexOf(chapter_start)]
        }
        table_values.chapter.push(chapter_num)
        table_values.text_title.push(text_title)
        var num_words_in_chapter = chapter_end - chapter_start
        table_values.words.push(num_words_in_chapter)
        var num_empty_in_chapter = 0
        var attr_diffs = {}
        for (attr_name in attribute_names) {
            attr_diffs[attr_name] = 0
        }
        for (var chapter_line = chapter_start; chapter_line < chapter_end; chapter_line++) {
            var attr_value_sets = {};
            for (attr_name in attribute_names) {
                attr_value_sets[attr_name] = new Set()
            }
            for (var wit_idx in witnesses) {
                wit = witnesses[wit_idx];
                for (var attr in attribute_values) {
                    if (attribute_values[attr][chapter_line][wit] == "empty") {
                        num_empty_in_chapter += 1
                        break
                    }
                    attr_value_sets[attr].add(attribute_values[attr][chapter_line][wit])
                }
            }
            for (attr_name in attribute_names) {
                attr_diffs[attr_name] += attr_value_sets[attr_name].size
            }
        }

        num_empty_in_chapter = num_empty_in_chapter / (num_words_in_chapter * witnesses.length)
        table_values.empty.push(num_empty_in_chapter)

        if (num_words_in_chapter > words_max_value) words_max_value = num_words_in_chapter
        if(num_words_in_chapter < words_min_value) words_min_value = num_words_in_chapter

        if (num_empty_in_chapter > empty_max_value) empty_max_value = num_empty_in_chapter
        if (num_empty_in_chapter < empty_min_value) empty_min_value = num_empty_in_chapter

        for (attr_name in attribute_names) {
            var norm_value = attr_diffs[attr_name] / num_words_in_chapter
            table_values[attr_name].push(norm_value)
            if (norm_value > attr_max_values[attr_name]) {
                attr_max_values[attr_name] = norm_value
            }
            if (norm_value < attr_min_values[attr_name]) {
                attr_min_values[attr_name] = norm_value
            }
        }
        chapter_num += 1
    }

    // set colors for heatmap
    var color_low = "white"
    var color_high = "#007bff"

    var words_color_scale = d3.scaleLinear()
        .domain([words_min_value, words_max_value])
        .range([color_low, color_high])

    var empty_color_scale = d3.scaleLinear()
        .domain([empty_min_value, empty_max_value])
        .range([color_low, color_high])
    
    var color_scales = {"words": words_color_scale, "empty": empty_color_scale}
    
    for (cur_attr in attribute_names) {
        var attr_color_scale = d3.scaleLinear()
            .domain([attr_min_values[cur_attr], attr_max_values[cur_attr]])
            .range([color_low, color_high])
        color_scales[cur_attr] = attr_color_scale
    }
    
    // generate table
    var table_string = "<div class='heatdiv'><table id='heatmaptable'><tr><th class='heatheadcol'>Text:</th>"

    for (var idx = 0; idx < text_starts.length; idx++) {
        var this_text_chapter_idx = chapter_starts.indexOf(text_starts[idx])
        if (idx == text_starts.length - 1) {
            var next_text_chapter_idx = chapter_starts.length
        } else {
            var next_text_chapter_idx = chapter_starts.indexOf(text_starts[idx + 1])
        }
        table_string += "<th colspan='" + (next_text_chapter_idx - this_text_chapter_idx) + "'>" + text_titles[idx] + "</th>"
    }

    table_string += "</tr><tr><th class='heatheadcol'>Chapter:</th>"

    for (var idx in table_values["chapter"]) {
        table_string += "<th class='numchaptercol'>" + table_values["chapter"][idx] + "</th>"
    }

    table_string += "</tr><tr><th class='heatheadcol'>Words:</th>"

    for (var idx in table_values["words"]) {
        table_string += "<td style='background: " + color_scales["words"](table_values["words"][idx]) + "; cursor: pointer;' data-toggle='tooltip' title='" + table_values["words"][idx] + " words' onclick=\"getDetails('" + table_values["text_title"][idx] + "', " + idx + ", " + table_values["chapter"][idx] + ", '" + "t" + "')\"><div class='heatmaptdfiller'></div></td>"
    }

    table_string += "</tr><tr><th class='heatheadcol'>Missing:</th>"

    for (var idx in table_values["empty"]) {
        table_string += "<td style='background: " + color_scales["empty"](table_values["empty"][idx]) + "; cursor: pointer;' data-toggle='tooltip' title='" + (table_values["empty"][idx] * 100).toFixed(2) + " % missing' onclick=\"getDetails('" + table_values["text_title"][idx] + "', " + idx + ", " + table_values["chapter"][idx] + ", '" + "t" + "')\"><div class='heatmaptdfiller'></div></td>"
    }

    for (var attr in attribute_names) {
        if (attr == "id") continue
        table_string += "</tr><tr><th class='heatheadcol'>" + attribute_names[attr] + ":</th>"
        for (var idx in table_values[attr]) {
            table_string += "<td style='background: " + color_scales[attr](table_values[attr][idx]) + "; cursor: pointer;' data-toggle='tooltip' title='" + table_values[attr][idx].toFixed(2) + " variants on average' onclick=\"getDetails('" + table_values["text_title"][idx] + "', " + idx + ", " + table_values["chapter"][idx] + ", '" + attr + "')\"><div class='heatmaptdfiller'></div></td>"
        }
    }

    table_string += "</tr><tr><td></td>"

    table_string += "</tr></table></div>"

    // append table to heatmap div
    $("#heatmap").html("")
    $("#heatmap").append(table_string)

    // show heatmap
    $("#heatmap-card").removeClass("d-none")

    // activate tool tips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })

    // add detail options
    createDetailOptions()
    $("#view-options").on("change", function(e) {
        createDetailOptions()
    })

    // highlight selected chapter
    $('td').on('click', function() {
        var $currentTable = $("#heatmaptable")
        var index = $(this).index()
        $currentTable.find('th').removeClass('selected')
        $currentTable.find('tr').eq(1).each(function() {
            $(this).find('th').eq(index).addClass('selected')
        })
    })
}

function createDetailOptions() {
    detail_options_string = "<span class='text-muted'>Attributes: </span>"
    if ($('input[name=view-options]:checked').val() == "option-table") {
        for (attr in attribute_names) {
            if (attr == "id" | attr == "t") continue
            detail_options_string += "<label class='checkbox-inline'><input type='checkbox' value='' id='cb_" + attr + "' onclick=\"checkboxHandler('" + attr + "')\">" + attribute_names[attr] + "</label> "
        }
    } else if ($('input[name=view-options]:checked').val() == "option-graph") {
        detail_options_string += "<label class='radio-inline'><input type='radio' name='detail-options' value='none' onchange='radioHandler()' checked>None</label> "
        for (attr in attribute_names) {
            if (attr == "id" | attr == "t") continue
            detail_options_string += "<label class='radio-inline'><input type='radio' name='detail-options' value='" + attr + "' onchange='radioHandler()'>" + attribute_names[attr] + "</label> "
        }
    }
    $("#detail-options").html("")
    $("#detail-options").append(detail_options_string)
}

function checkboxHandler(attr) {
    if($("#cb_" + attr).is(':checked')){
        $("span[name='mark_" + attr + "']").removeClass("d-none")
    } else {
        $("span[name='mark_" + attr + "']").addClass("d-none")
    }
}

function radioHandler() {
    var attr_option = $('input[name=detail-options]:checked').val()
    $("g[name^='svg_group']").attr("visibility", "hidden")
    $("g[name='svg_group_" + attr_option + "']").attr("visibility", "visible")
}

function getDetails(text_title, chapter_idx, chapter_real, attribute) {
    $("#details-card").removeClass("d-none")
    $("#chapter-title").html(text_title + ": Chapter " + (chapter_real))
    if ($('input[name=view-options]:checked').val() == "option-table") {
        buildTable(chapter_idx)
    } else if ($('input[name=view-options]:checked').val() == "option-graph") {
        buildGraph(chapter_idx)
    }

    $("#view-options").off("change")
    $("#view-options").on("change", function(e) {
        createDetailOptions()
        if ($('input[name=view-options]:checked').val() == "option-table") {
            buildTable(chapter_idx)
        } else if ($('input[name=view-options]:checked').val() == "option-graph") {
            buildGraph(chapter_idx)
        }
    })
}

function buildTable(chapter_idx) {
    var empty_color = "#f0f0f0"
    var highlight_color = "#ffcc5c"

    $("#chapter-details").html("")

    var chapter_start = chapter_starts[chapter_idx]
    if (chapter_idx == chapter_starts.length - 1) {
        var chapter_end = attribute_values["t"].length
    } else {
        var chapter_end = chapter_starts[chapter_idx + 1]
    }

    var table_string = "<table class='table table-sm table-bordered' id='detailstable'><thead><tr><th class='bg-white'>#</th>"

    for (var wit_idx = 0; wit_idx < witnesses.length; wit_idx++) {
        table_string += "<th class='bg-white'>" + witnesses[wit_idx] + "</th>"
    }

    table_string += "</tr></thead>"
    
    var text_num = 1
    for (var text_idx = chapter_start; text_idx < chapter_end; text_idx++) {
        table_string += "<tbody><tr><td>" + text_num + "</td>"

        var unique_word_occurrences = {};
        for (var wit in attribute_values["t"][text_idx]) {
            var word = attribute_values["t"][text_idx][wit]
            if (word == "empty") continue
            unique_word_occurrences[word] = 1 + (unique_word_occurrences[word] || 0);
        }

        var sorted_unique_words = Object.keys(unique_word_occurrences).sort(function(a, b) {return unique_word_occurrences[b] - unique_word_occurrences[a]})
        
        var max_word_list = []
        for (var unique_word_idx = 0; unique_word_idx < sorted_unique_words.length; unique_word_idx++) {
            max_word_list.push(sorted_unique_words[unique_word_idx])
            if (unique_word_occurrences[sorted_unique_words[unique_word_idx+1]] < unique_word_occurrences[sorted_unique_words[unique_word_idx]]) break
        }

        if (max_word_list.length > 1) var normal_color = "#ffeead"
        else var normal_color = "white"

        for (var wit in attribute_values["t"][text_idx]) {
            var id = attribute_values["id"][text_idx][wit]
            var word = attribute_values["t"][text_idx][wit]
            if (max_word_list.includes(word)) {
                var color = normal_color
            }
            else if (word == "empty") {
                word = ""
                var color = empty_color
            } else {
                var color = highlight_color
            }
            table_string += "<td style='position: relative; background: " + color + ";'>"
            if (word != ""){
                table_string += "<div style='position:absolute; left:3px; top:-2px;'><span class='badge badge-light small'>" + (sorted_unique_words.indexOf(word) + 1) + "</span></div>" + word + "<div style='position:absolute; right:3px; top:-2px;'>"
                for (attr in attribute_names) {
                    if (attr == "id" | attr == "t") continue
                    var attr_value = attribute_values[attr][text_idx][wit]
                    if (attr_value) table_string += " <span class='badge badge-primary small' name=mark_" + attr +  ">" + attribute_names[attr].substring(0,2) + "</span>"
                }
                table_string += "</div>"
            }
            table_string += "</td>"
        }
        text_num += 1
        table_string += "</tr>"
    }
    table_string += "</tbody></table>"
    $("#chapter-details").append(table_string)
    $("#detailstable").stickyTableHeaders();
    for (attr in attribute_names) {
        checkboxHandler(attr)
    }
}

function buildGraph(chapter_idx) {
    $("#chapter-details").html("")

    var chapter_start = chapter_starts[chapter_idx]
    if (chapter_idx == chapter_starts.length - 1) {
        var chapter_end = attribute_values["t"].length
    } else {
        var chapter_end = chapter_starts[chapter_idx + 1]
    }

    var num_lines = chapter_end - chapter_start

    var left_margin = 10
    var right_margin = 10
    var top_margin = 10
    var bottom_margin = 10
    var node_height = 30
    var node_x_padding = 20
    var node_y_padding = 40
    var empty_node_width = 50
    var text_attr_padding = 100
    var true_false_node_width = 20

    var svg = d3.select("#chapter-details").append("svg:svg")
                                            .attr("width", 0)
                                            .attr("height", ((node_height + node_y_padding) * num_lines) - node_y_padding + top_margin + bottom_margin)

    var svg_none_group = svg.append("svg:g")
                        .attr("transform", "translate(" + left_margin + "," + top_margin + ")")
                        .attr("name", "svg_group_none")

    var text_line = 0
    var svg_total_width = 0
    var pre_anchor_points = null
    for (var text_idx = chapter_start; text_idx < chapter_end; text_idx++) {
        var anchor_points = {"top": {}, "bottom": {}}
        var unique_words = {"empty": []}
            for (var wit in attribute_values["t"][text_idx]) {
                var cur_word = attribute_values["t"][text_idx][wit]
                if (cur_word in unique_words) {
                     unique_words[cur_word].push(wit)
                } else {
                    unique_words[cur_word] = [wit]
                }
            }

        for (word in unique_words) {
            var tooltip = ""
            for (var wit_idx in unique_words[word]) {
                tooltip += unique_words[word][wit_idx] + " "
            }
            var y_position = (text_line * (node_height + node_y_padding))
            if (word == "empty") {
                var x_position = 0
                var text_node_group = svg_none_group.append("svg:g")
                                      .attr("transform", "translate(" + x_position + "," + y_position + ")")

                var rect = text_node_group.append("svg:rect")
                    .attr("height", node_height)
                    .attr("width", empty_node_width)
                    .style("stroke", "black")
                    .style("stroke-width", "2px")
                    .style("fill", "#f0f0f0")
                    .attr("data-toggle", "tooltip")
                    .attr("title", tooltip)

                var pre_x_position = empty_node_width
                anchor_points["top"][word] = {"x": x_position + (empty_node_width / 2), "y": y_position}
                anchor_points["bottom"][word] = {"x": x_position + (empty_node_width / 2), "y": y_position + node_height}
            } else {
                var x_position = pre_x_position + node_x_padding + true_false_node_width

                var text_node_group = svg_none_group.append("svg:g")
                                      .attr("transform", "translate(" + x_position + "," + y_position + ")")

                var rect = text_node_group.append("svg:rect")
                            .attr("height", node_height)
                            .style("stroke", "black")
                            .style("stroke-width", "2px")
                            .style("fill", "white")

                var text = text_node_group.append("svg:text")
                            .attr("dy", "1em")
                            .attr("dominant-baseline", "middle")
                            .attr("data-toggle", "tooltip")
                            .attr("title", tooltip)
                            .text("\u00A0" + word + "\u00A0")
                
                var textSize = text.node().getBBox()
                rect.attr("width", textSize.width)

                var pre_x_position = x_position + textSize.width + true_false_node_width
                anchor_points["top"][word] = {"x": x_position + (textSize.width / 2), "y": y_position}
                anchor_points["bottom"][word] = {"x": x_position + (textSize.width / 2), "y": y_position + node_height}
            }
            svg_total_width = Math.max(svg_total_width, pre_x_position)
        }

        if (text_idx > chapter_start) {
            var edges = new Set()
            for (var wit in attribute_values["t"][text_idx]) {
                var cur_edge = attribute_values["t"][text_idx - 1][wit] + "_" + attribute_values["t"][text_idx][wit]
                edges.add(cur_edge)
            }
            
            function addEdges(value1, value2, set) {
                var source_target = value1.split("_")
                svg_none_group.append("line")
                            .style("stroke", "black")
                            .style("stroke-width", "2px")
                            .attr("x1", pre_anchor_points["bottom"][source_target[0]]["x"])
                            .attr("y1", pre_anchor_points["bottom"][source_target[0]]["y"])
                            .attr("x2", anchor_points["top"][source_target[1]]["x"])
                            .attr("y2", anchor_points["top"][source_target[1]]["y"])
            }
            edges.forEach(addEdges)
        }
        pre_anchor_points = anchor_points
        text_line += 1
    }

    for (attribute in attribute_names) {
        if (attribute == "id" | attribute == "t") continue

        var svg_attr_group = svg.append("svg:g")
                        .attr("transform", "translate(" + left_margin + "," + top_margin + ")")
                        .attr("name", "svg_group_" + attribute)

        var text_line = 0
        var text_group_total_width = 0
        var pre_anchor_points = null
        for (var text_idx = chapter_start; text_idx < chapter_end; text_idx++) {
            var anchor_points = {"top": {}, "bottom": {}}
            var unique_words = {"empty": []}
                for (var wit in attribute_values["t"][text_idx]) {
                    var cur_word = attribute_values["t"][text_idx][wit]
                    if (cur_word in unique_words) {
                         unique_words[cur_word].push(wit)
                    } else {
                        unique_words[cur_word] = [wit]
                    }
                }

            for (word in unique_words) {
                var y_position = (text_line * (node_height + node_y_padding))
                if (word == "empty") {
                    var tooltip = ""
                    for (var wit_idx in unique_words[word]) {
                        tooltip += unique_words[word][wit_idx] + " "
                    }
                    var x_position = 0
                    var text_node_group = svg_attr_group.append("svg:g")
                                          .attr("transform", "translate(" + x_position + "," + y_position + ")")

                    var rect = text_node_group.append("svg:rect")
                        .attr("height", node_height)
                        .attr("width", empty_node_width)
                        .style("stroke", "black")
                        .style("stroke-width", "2px")
                        .style("fill", "#f0f0f0")
                        .attr("data-toggle", "tooltip")
                        .attr("title", tooltip)

                    var pre_x_position = empty_node_width
                    anchor_points["top"][word] = {"empty": {"x": x_position + (empty_node_width / 2), "y": y_position}}
                    anchor_points["bottom"][word] = {"empty": {"x": x_position + (empty_node_width / 2), "y": y_position + node_height}}
                } else {
                    true_tooltip = ""
                    false_tooltip = ""
                    for (var wit_idx in unique_words[word]) {
                        if (attribute_values[attribute][text_idx][unique_words[word][wit_idx]]) true_tooltip += unique_words[word][wit_idx] + " "
                        else false_tooltip += unique_words[word][wit_idx] + " "
                    }

                    var x_position = pre_x_position + node_x_padding

                    var true_rect = svg_attr_group.append("svg:rect")
                                                    .attr("transform", "translate(" + x_position + "," + y_position + ")")
                                                    .attr("height", node_height)
                                                    .attr("width", true_false_node_width)
                                                    .attr("data-toggle", "tooltip")
                                                    .attr("title", true_tooltip)
                                                    .style("stroke", "black")
                                                    .style("stroke-width", "2px")
                                                    .style("fill", "#96ceb4")

                    var text_node_group = svg_attr_group.append("svg:g")
                                          .attr("transform", "translate(" + (x_position + true_false_node_width) + "," + y_position + ")")

                    var rect = text_node_group.append("svg:rect")
                                .attr("height", node_height)
                                .style("stroke", "black")
                                .style("stroke-width", "2px")
                                .style("fill", "white")

                    var text = text_node_group.append("svg:text")
                                .attr("dy", "1em")
                                .attr("dominant-baseline", "middle")
                                .text("\u00A0" + word + "\u00A0")
                    
                    var textSize = text.node().getBBox()
                    rect.attr("width", textSize.width)

                    var false_rect = svg_attr_group.append("svg:rect")
                                                    .attr("transform", "translate(" + (x_position + true_false_node_width + textSize.width) + "," + y_position + ")")
                                                    .attr("height", node_height)
                                                    .attr("width", true_false_node_width)
                                                    .attr("data-toggle", "tooltip")
                                                    .attr("title", false_tooltip)
                                                    .style("stroke", "black")
                                                    .style("stroke-width", "2px")
                                                    .style("fill", "#ff6f69")

                    var pre_x_position = x_position + textSize.width + (true_false_node_width * 2)
                    anchor_points["top"][word] = {"true": {"x": x_position + (true_false_node_width / 2), "y": y_position}, "false": {"x": x_position + true_false_node_width + textSize.width + (true_false_node_width / 2), "y": y_position}}
                    anchor_points["bottom"][word] = {"true": {"x": x_position + (true_false_node_width / 2), "y": y_position + node_height}, "false": {"x": x_position + true_false_node_width + textSize.width + (true_false_node_width / 2), "y": y_position + node_height}}
                }
            }

            if (text_idx > chapter_start) {
                var edges = new Set()
                for (var wit in attribute_values["t"][text_idx]) {
                    var pre_word = attribute_values["t"][text_idx - 1][wit]
                    var word = attribute_values["t"][text_idx][wit]
                    var pre_attr_value = attribute_values[attribute][text_idx - 1][wit]
                    var attr_value = attribute_values[attribute][text_idx][wit]
                    var cur_edge = pre_word + "|" + pre_attr_value + "_" + word + "|" + attr_value
                    edges.add(cur_edge)
                }
                
                function addEdges(value1, value2, set) {
                    var source = value1.split("_")[0]
                    var target = value1.split("_")[1]
                    var source_word = source.split("|")[0]
                    var source_attr = source.split("|")[1]
                    var target_word = target.split("|")[0]
                    var target_attr = target.split("|")[1]

                    svg_attr_group.append("line")
                                .style("stroke", "black")
                                .style("stroke-width", "2px")
                                .attr("x1", pre_anchor_points["bottom"][source_word][source_attr]["x"])
                                .attr("y1", pre_anchor_points["bottom"][source_word][source_attr]["y"])
                                .attr("x2", anchor_points["top"][target_word][target_attr]["x"])
                                .attr("y2", anchor_points["top"][target_word][target_attr]["y"])
                }
                edges.forEach(addEdges)
            }
            pre_anchor_points = anchor_points
            text_line += 1
        }
    }

    svg.attr("width", svg_total_width + left_margin + right_margin)

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
    radioHandler()
}
