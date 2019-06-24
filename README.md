# InCritApp -  Interactive Critical Apparatus

![InCritApp](/docs/images/tool.PNG)

InCritApp combines distant and close reading methods to compare texts transcribed by different authors. You can compare multiple texts and chapters by using a table or graph representation of word tokens.

Note that this tool is a work in progress. If you come across a bug, please feel free to open a new issue.

## Usage

InCritApp is very simple to use. Since it is a web application build on JavaScript, all you have to do is either to checkout the repository and open the `InCritApp.html` file in a web browser of your choice. Despite being a web application, it works without an active internet connection.

### File Format and Import
Your input data must be a JSON file containing text data in CollateX export format and additional metadata, such as witness names or offsets to text starts. In particular, it must contain the following keys:

| Key | Description |
| --- | --- |
| `witnesses` | List containing names of text witnesses in the same order as in the CollateX data. |
| `text_starts` | List containing integers marking offsets of text starts. |
| `text_titles` | List containing names of texts. Must be of same length and in the same order as `text_starts`. |
| `chapter_starts` | List containing integers marking offsets of chapter starts. The offset of the first chapter of a text is equal to the respective text offset. |
| `attribute_names` | Dictionary containing a mapping for more descriptive attribute names. |
| `table` | JSON data in CollateX export format. |

#### CollateX export format
The structure is a two-dimensional array, where rows represent word tokens in a sequential order, and columns contain variant readings of witnesses. The order of witnesses must be the same as in the list contained in `witnesses`. Each element is a dictionary containing at least an `id` and a `t` key, but additional attributes can be added. Note that each key must be mapped in the `attribute_names` mapping. 

#### Example JSON file
```
{
    "witnesses" : ["author1", "author2", "author3", "author4"],
    "text_starts": [0,100],
    "text_titles": ["Example1", "Example2"],
    "chapter_starts": [0, 50, 100, 115, 150],
    "attribute_names": {"id":"ID", "t": "Text"},
    "table": [
        [[{"id":"1.1","t":"This"}], [{"id":"1.1","t":"This"}], [{"id":"1.3","t":"This"}], [{"id":"1.4","t":"That"}]], 
        [[{"id":"2.1","t":"is"}], [{"id":"2.2","t":"is"}], [{"id":"2.3","t":"is"}], [{"id":"2.4","t":"is"}]],
        [[{"id":"3.1","t":"a"}], [{"id":"3.2","t":"a"}], [{"id":"3.3","t":"a"}], [{"id":"3.4","t":"an"}]],
        [[{"id":"4.1","t":"test"}], [{"id":"4.2","t":"test"}], [{"id":"4.3","t":"test"}], [{"id":"4.4","t":"example"}]],
        ...
    ]
}
    
```

In this example, we are comparing transcriptions of 4 different authors, comparising two texts entitled *Example1* and *Example2*, where the first text has two chapters and the second text also has two chapters. 

Once you file format is right, you can use the import dialog in the top left corner to import your `.json` file.

### File Information
After importing your data, you should check the file information box in the top center of InCritApp and make sure that the imported file has been processed properly. 

### The Heatmap Overview (Distant Reading)
![Heatmap](/docs/images/heatmap.PNG)
One essential part of InCritApp is the heatmap, providing you a distant reading method of imported data and serving as an entry point for the comparison. Each row represents an attribute, such as the number of word tokens or deviations in word tokens, and each column represents a chapter in a text. The colors of cells represent the magnitude of deviations between different attributes and, hence, indicate interesting text passages for which you might want a detailed comparison. Dark blue colors indicate higher numbers of variations and bright blue colors indicate smaller numbers of variations. Once you find an interesting chapter you would like to investigate further, just click on it. This will open the comparison view. 

### The Comparison View (Close Reading)
The comparison view is a close reading method allowing you to investigate text variations in detail. By default, the comparison view is opened in table mode. However, you can change the view to graph mode and back to table mode again by using the switch provided in the options dialog.

#### Table Mode
In table mode, text is represented in a table where rows consecutively list words and columns represent variations of text witnesses. Cell colors indicate deviations across witnesses, respectively for each row.

![Row Example 1](/docs/images/table_row_example_1.PNG)
In the above example, white cells indicate the term used by the majority of witnesses, whereas orange cells indicate deviations from that majority vote. Gray cells indicate that the term is missing for the respective witness.

![Row Example 2](/docs/images/table_row_example_2.PNG)
In this example, yellow cells indicate that there is no majority and the commonly used term is undetermined.

Note that the number in the top left corner of each cell indicates the unique word count in a row.

Further, you can use the options dialog to display attribute information for each cell.

#### Graph Mode
In graph mode, text is represented in the form of a graph, where nodes represent words and edges represent consecutive transitions from one word to another. You can hover the mouse cursor over a node to see which authors uesd the respective word. Additionally, you can select one additional attribute at a time and display `true` (green color) and `false` (red color) values of it. The gray node on the left of each "line" represents missing words, i.e. a passage in text where words are missing for respective witnesses.

### Options
Here you can change between table and graph mode as well as selecting additional attributes you want to display in the comparison view.

## Acknowledgements
I want to thank Roman Bleier working at the Centre for Information Modelling (ZIM) for his input and suggestions while developing InCritApp.

## Libraries  Used
InCritApp uses the following existing libraries:

| Package | License |
| --- | --- |
| Bootstrap 4.1 | MIT License |
| jQuery | MIT License |
| Popper.js | MIT License |
| D3.js | BSD 3-clause "New" or "Revised" license |
| dagre-d3 | MIT License |
| StickyTableHeaders | MIT License |

I want to thank all the developers of these libraries for their effort and amazing work.
