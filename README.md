# Genonym
Convert the DNA sequence that codes for a protein in one species to the appropriate sequence that will work in a different species, **while optimizing for the highest rate of translation (conversion to protein)**.

On my laptop, Genonym converts and optimizes 3 million base pairs per second.

# Installation

```bash
npm install genonym --save
```

# Quick Start
```javascript
var Genonym = require("genonym")

Genonym.init({ speciesPath: "./species" })

Genonym.convert({
  inputSpecies: "Saccharomyces cerevisiae", // yeast
  outputSpecies: "Homo sapiens", // humans
  sequenceType: "dna",
  sequence: "ATGTCCAGTTCACAACAAATAGCCAAAAATGCCCGTAAAGCAGGG..."
}, (err, converted) => {
    if (err) {
      return console.error("Error occurred:", err)
    }
    console.log("Got converted and optimized sequence:", converted)
})

```

# Documentation

## Genonym.init
This function initializes Genonym and loads all the species into memory.
It has the form:

```javascript
Genonym.init(config)
```
where `config` can be an object (see [Config Options](#Config Options)):

```javascript
Genonym.init({ speciesPath: "./species" })
```
Or a path to a JSON file containing a stringified configuration object:

```javascript
Genonym.init("./config/genonym-config.json")
```

Or nothing at all, in which case the default configuration object is used:

```javascript
Genonym.init()
```

## Genonym.convert
This function converts a DNA sequence that codes for a particular protein in **Species A**, to a DNA sequence that will code for the same protein in **Species B**, and will use different codons to **optimize translation throughput**.
It has the form: 

```javascript
Genonym.convert(conversionObject, callback)
```

where `conversionObject` is an object describing the conversion you'd like to occur, and `callback` is an optional callback function of the form (`err`, `sequence`). 

### Conversion Object
The `conversionObject` should have several properties in order to precisely specify the conversion you desire:

```javascript
{
  inputSpecies : "<SPECIES>",    // The species from which your sequence originates (this species must be loaded!)
  outputSpecies: "<SPECIES>",    // The species you would like your sequence to work in and be optimized for (this species must be loaded!)
  sequenceType : "DNA",          // You can choose `DNA`, `RNA`, or `PROTEIN`
  sequence : "<YOUR_SEQUENCE>",  // e.g. "CGACGTACTTTGGCCTAA..."
  outputType: "DNA"              // You can choose `DNA`, or `RNA`
}
```

Please notice that for the field `sequenceType`, you can choose `DNA`, `RNA`, or `PROTEIN`.  If you choose `PROTEIN`, Genonym will find either the DNA or RNA sequence that will produce that protein, depending on the value of the `outputType` field.

## Genonym.DNAToRNA
This function converts any DNA sequence into the corresponding RNA sequence.
It has the form:

```javascript
Genonym.DNAToRNA(sequenceObject, callback)
```

Where `callback` is a function of the form (`err`, `RNA`).

### sequenceObject
The `sequenceObject` argument should have the following structure:

```javascript
{
  speciesName: "<SPECIES>",
  sequence: "<YOUR_SEQUENCE>"
}
```

## Genonym.RNAToDNA
This function converts any RNA sequence into the corresponding DNA sequence.
It has the form:

```javascript
Genonym.RNAToDNA(sequenceObject, callback)
```

Where `callback` is a function of the form (`err`, `DNA`).

### sequenceObject
The `sequenceObject` argument should have the following structure:

```javascript
{
  speciesName: "<SPECIES>",
  sequence: "<YOUR_SEQUENCE>"
}
```

# Config Options

The config object has properties you can change to make Genonym behave slightly differently.
These are the properties currently supported:

`speciesPath` - The directory in which Genonym will look for JSON files containing the necessary [Species Data](#Species Data).

`logLevel` - Controls the amount of logging that Genonym does.  Valid values are: `silent`, `normal`, and `verbose`.  The default value is of course `normal`.

# Species Data
Species data is stored in JSON files, and to properly convert sequences from one species to another, they each need to have JSON with a certain structure, and some required properties.  You can have custom properties and sub-structures if you like.

### Structure
These are the properties required in all species files:

`speciesName` - This is a **string**.  You must use this string to identify this species if it is defined.  If it is not defined, the filename (without the extension) will be used to identify the species.

`codonToAmino` - This is an **object**, where each key is the **3 capital letter** notation for a codon, and the value corresponding to that key is the amino acid which is coded for.

`aminoToCodon` - This is an **object**, where each key is the **1 capital letter** notation for an amino acid, and the value corresponding to that key is the codon which is *most frequently used in the natural organism* to code for that amino acid. 

`DNAToRNA` - This describes the way transcription occurs in your organism.  For example, in most, if not all organisms this field should have a value of: 

```JSON
{
  "A": "U",
  "T": "A",
  "C": "G",
  "G": "C"
}
```

`RNAToDNA` - This is essentially a convenience field, which allows you to go from a unit of RNA to the correct unit of DNA.  It is the reverse of `DNAToRNA`.  For most if not all organisms the value of `RNAToDNA` will be:

```JSON
{
  "U": "A",
  "A": "T",
  "G": "C",
  "C": "G"
}
```

### Hint
To construct these files, you can first write the `codonToAmino` object, and then go to the **Codon Usage Database** *(Which contains around 36,000 species)* and look up your species.  For each amino acid, find the codon used most frequently.

### Example
*Some common or important species files have already been written for you, and can be found in the `./species/` folder!*

An example species file for humans would be:

```JSON
{
  "speciesName": "Homo sapiens",
  "codonToAmino": {
    "UUU": "F",
    "UUC": "F",

    "UUA": "L",
    "UUG": "L",
    "CUU": "L",
    "CUC": "L",
    "CUA": "L",
    "CUG": "L",

    "AUU": "I",
    "AUC": "I",
    "AUA": "I",

    "AUG": "M",

    "GUU": "V",
    "GUC": "V",
    "GUA": "V",
    "GUG": "V",
		
    "UCU": "S",
    "UCC": "S",
    "UCA": "S",
    "UCG": "S",
    "AGU": "S",
    "AGC": "S",

    "CCU": "P",
    "CCC": "P",
    "CCA": "P",
    "CCG": "P",

    "ACU": "T",
    "ACC": "T",
    "ACA": "T",
    "ACG": "T",

    "GCU": "A",
    "GCC": "A",
    "GCA": "A",
    "GCG": "A",

    "UAU": "Y",
    "UAC": "Y",

    "UAA": "*",
    "UAG": "*",
    "UGA": "*",

    "CAU": "H",
    "CAC": "H",

    "CAA": "Q",
    "CAG": "Q",

    "AAU": "N",
    "AAC": "N",

    "AAA": "K",
    "AAG": "K",

    "GAU": "D",
    "GAC": "D",

    "GAA": "E",
    "GAG": "E",

    "UGU": "C",
    "UGC": "C",

    "UGG": "W",

    "CGU": "R",
    "CGC": "R",
    "CGA": "R",
    "CGG": "R",
    "AGA": "R",
    "AGG": "R",

    "GGU": "G",
    "GGC": "G",
    "GGA": "G",
    "GGG": "G"
  },
  "aminoToCodon": {
    "F": "UUC",
    "L": "CUG",
    "I": "AUC",
    "M": "AUG",
    "V": "GUG",
    "S": "AGC",
    "P": "CCC",
    "T": "ACC",
    "A": "GCC",
    "Y": "AUC",
    "*": "UGA",
    "H": "CAC",
    "Q": "CAG",
    "N": "AAC",
    "K": "AAG",
    "D": "GAC",
    "E": "GAG",
    "C": "UGC",
    "R": "AGA",
    "G": "GGC"
  },
  "DNAToRNA": {
    "A": "U",
    "T": "A",
    "C": "G",
    "G": "C"
  },
  "RNAToDNA": {
    "U": "A",
    "A": "T",
    "G": "C",
    "C": "G"
  }
}
```
# Performance
Genonym can convert and optimize DNA, RNA, and amino acid sequences very quickly.  On my `MacBook Pro (Retina, 13-inch, Late 2012)`, the time to operate on somewhat long sequences (`73,000 bp`) hovered around `18-22ms`.  Please note that I have not performed any careful or extensive benchmarking.

#License
This work uses the `GPL-3.0` license.

Please see (https://www.gnu.org/licenses/gpl-3.0.en.html) if you are not familiar with this license.

Please provide credit where it is due, (`Thank you @wbrickner for Genonym`) if this package saved you time, money, or effort.  **I worked hard on it and gave it to you for free**.


# Disclaimer
THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
