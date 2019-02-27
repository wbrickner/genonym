//
//  Genonym (v1.0.1)
//  Written and created by Will Brickner
//
//  ----------------------------------------------------
//
//  LICENSE
//
//  This work uses the GPL-3.0 license.
//  Please see (https://www.gnu.org/licenses/gpl-3.0.en.html) 
//  if you are not familiar with this license.
//
//  ----------------------------------------------------
//
//  DISCLAIMER
//
//  THIS SOFTWARE IS PROVIDED "AS IS" AND ANY EXPRESSED 
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, 
//  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS 
//  FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT 
//  SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE FOR ANY 
//  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
//  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
//  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
//  AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
//  STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
//  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN 
//  IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

var fs = require("fs")
,   path = require("path")
,   moduleConfig = {
        speciesPath: "./species/",
        logLevel: "normal"
    }
,   species = { }

module.exports = {
    init: function init(config) {
        if (typeof config === "string") {
            // lookup the config file
            moduleConfig = JSON.parse(fs.readFileSync(config, "utf8"));
        } else if (typeof config === "object") {
            for (var setting in config) {
                moduleConfig[setting] = config[setting];
            }
        }
        // (The default config is used if none is provided)
        
        // Manipulate the data to be more easily usable
        moduleConfig.logLevel = moduleConfig.logLevel.toLowerCase();
        
        // Now detect any species conversion files
        var files = fs.readdirSync(moduleConfig.speciesPath);      
        for (var j = 0, jlen = files.length; j < jlen; ++j) {
            // we only want JSON files
            if (files[j].substr(files[j].length - 5, 5).toLowerCase() === ".json") {
                // check that it really is a file (it could be a directory, eg ./directory.json/)
                let stats = fs.statSync(path.join(moduleConfig.speciesPath, files[j]));        
                if (stats.isFile() === true) {
                    // Try to parse the file as JSON.  If there is a name provided in the JSON, then use that name.
                    // If no name is provided or the name provided exists already in the `species` object, 
                    //   use the filename without the extension.
                    try {
                        let parsed = JSON.parse(fs.readFileSync(path.join(moduleConfig.speciesPath, files[j]), "utf8"))
                        ,   speciesName = parsed.speciesName || files[j].substr(0, files[j].length - 5)
                        
                        if (typeof species[speciesName] !== "undefined") {
                            speciesName = files[j].substr(0, files[j].length - 5)
                        }
                        
                        if (typeof parsed.codonToAmino !== "object" || typeof parsed.aminoToCodon !== "object") {
                            // TODO: try to fix broken species files automatically
                            if (moduleConfig.logLevel !== "silent") {
                                console.error(`[Genonym]\tError: The species file "${files[j]}" ${parsed.speciesName ? " (\"" + parsed.speciesName + "\")" : ""} was missing some critical data.  This species was not loaded.`)
                            }
                        } else {
                            parsed.filepath = files[j]
                            species[speciesName] = parsed
                        }
                    } catch (e) {
                        // Assume any exception is because of invalid JSON
                        if (moduleConfig.logLevel !== "silent") {
                            console.error(`\n[Genonym]\tWarning: the file "${files[j]}" is not valid.  It could not be added as a species.\n`)
                        }
                    }
                }
            }
        }
        if (moduleConfig.logLevel === "verbose") {
            console.log(`[Genonym]\tDetected and loaded ${files.length} species from '${moduleConfig.speciesPath}'.`)
        }
    },
    DNAToRNA: function DNAToRNA(obj, cb) {
        let RNASequence = new Array(obj.sequence.length)
        ,   DNAToRNA_map = species[obj.speciesName].DNAToRNA

        for (var j = 0, jlen = obj.sequence.length; j < jlen; ++j) {
            RNASequence[j] = DNAToRNA_map[obj.sequence[j]]
        }
        
        // provide the output
        if (typeof cb === "function") {
            return cb(null, RNASequence.join(""))
        } else {
            return {
                err: null,
                sequence: RNASequence.join("")
            }
        }
    },
    RNAToDNA: function RNAToDNA(obj, cb) {
        let DNASequence = new Array(obj.sequence.length)
        ,   RNAToDNA_map = species[obj.speciesName].RNAToDNA
        
        for (var j = 0, jlen = obj.sequence.length; j < jlen; ++j) {
            DNASequence[j] = RNAToDNA_map[obj.sequence[j]]
        }
        
        if (typeof cb === "function") {
            return cb(null, DNASequence.join(""))
        } else {
            return {
                err: null,
                sequence: DNASequence.join("")
            }
        }
    },
    convert: function convert(obj, cb) {
        // check for invalidity in the parameters
        let errors = []

        if (typeof obj.sequenceType !== "string") {
            if (moduleConfig.logLevel !== "silent") {
                console.error(`[Genonym]\tError: The 'sequenceType' property must be a String, it is of type "${typeof obj.sequenceType}".`)
            }
            errors.push("Invalid_Property")
        }
        if (typeof obj.outputType !== "string") {
            if (moduleConfig.logLevel !== "silent") {
                console.error(`[Genonym]\tError: The 'outputType' property must be a String, it is of type "${typeof obj.outputType}".`)
            }
            errors.push("Invalid_Property")
        }
        if (typeof obj.sequence !== "string") {
            if (moduleConfig.logLevel !== "silent") {
                console.error(`[Genonym]\tError: The 'sequence' property must be a String, it is of type "${typeof obj.sequence}".`)
            }
            errors.push("Invalid_Property")
        }
        if (typeof obj.inputSpecies !== "string") {
            if (moduleConfig.logLevel !== "silent") {
                console.error(`[Genonym]\tError: The 'inputSpecies' property must be a String, it is of type "${typeof obj.inputSpecies}".`)
            }
            errors.push("Invalid_Property")
        }
        if (typeof obj.outputSpecies !== "string") {
            if (moduleConfig.logLevel !== "silent") {
                console.error(`[Genonym]\tError: The 'outputSpecies' property must be a String, it is of type "${typeof obj.outputSpecies}".`)
            }
            errors.push("Invalid_Property")
        }
        // check that these species exist
        if (typeof species[obj.inputSpecies] === "undefined") {
            if (moduleConfig.logLevel !== "silent") {
                console.error("[Genonym]\tError: The 'inputSpecies' you chose does not exist in the current context.")
            }
            errors.push("No_Such_Species")
        }
        if (typeof species[obj.outputSpecies] === "undefined") {
            if (moduleConfig.logLevel !== "silent") {
                console.error("[Genonym]\tError: The 'outputSpecies' you chose does not exist in the current context.")
            }
            errors.push("No_Such_Species")
        }
        // check for any errors that were detected
        if (errors.length !== 0) { 
            if (typeof cb === "function") {
                cb(errors, null)
            } else {
                return {
                    err: errors,
                    sequence: null
                }
            }
        }
        
        let sequenceType = obj.sequenceType.toUpperCase()
        ,   outputType = obj.outputType.toUpperCase()
        
        obj.sequence = obj.sequence.toUpperCase()
        
        // now do the conversion
        if (sequenceType === "DNA") {
            // convert to RNA, then to amino acid representation, and then back to DNA
            
            module.export.DNAToRNA({
                speciesName: obj.inputSpecies,
                sequence: obj.sequence
            }, (err, RNA) => {
                // cache this 
                let inputSpeciesCodonToAmino = species[obj.inputSpecies].codonToAmino
                ,   outputSpeciesAminoToCodon = species[obj.outputSpecies].aminoToCodon;
                
                // intermediate amino acid representation
                let outputSequence = new Array(Math.floor(RNA.length / 3))
                for (var j = 0, k = 0, jlen = Math.floor(RNA.length / 3); j < jlen; ++j, k += 3) {
                    outputSequence[j] = outputSpeciesAminoToCodon[inputSpeciesCodonToAmino[RNA.substr(k, 3)]]
                }
                
                // provide the output
                if (typeof cb === "function") {
                    cb(null, outputSequence.join(""))
                }
                else {
                    return {
                        err: null,
                        sequence: outputSequence.join("")
                    }
                }
            })
        }
        else if (sequenceType === "RNA") {
            // cache this 
            let inputSpeciesCodonToAmino = species[obj.inputSpecies].codonToAmino
            ,   outputSpeciesAminoToCodon = species[obj.outputSpecies].aminoToCodon
            
            // intermediate amino acid representation
            let outputSequence = new Array(Math.floor(obj.sequence.length / 3))
            for (var j = 0, k = 0, jlen = Math.floor(obj.sequence.length / 3); j < jlen; ++j, k += 3) {
                outputSequence[j] = outputSpeciesAminoToCodon[inputSpeciesCodonToAmino[obj.sequence.substr(k, 3)]]
            }
            
            // if the user wants the optimized sequence in RNA, we already have it
            if (outputType === "RNA") {
                // provide the output
                if (typeof cb === "function") {
                    cb(null, outputSequence.join(""))
                }
                else {
                    return {
                        err: null,
                        sequence: outputSequence.join("")
                    }
                }
            } else if (outputType === "DNA") {
                // if the user wants the optimized sequence returned in DNA,
                // convert the RNA back into DNA and then return it.
                module.export.RNAToDNA({
                    speciesName: obj.outputSpecies,
                    sequence: outputSequence.join("")
                }, (err, DNA) => {
                    // provide the output
                    if (typeof cb === "function") {
                        cb(null, DNA);
                    }
                    else {
                        return {
                            err: null,
                            sequence: DNA
                        }
                    }
                })
            }
        }
        else if (sequenceType === "PROTEIN") {
            // the input is already a sequence of amino acids, and the user wants it returned 
            // as an optimized sequence of DNA or RNA
            
            let outputSpeciesAminoToCodon = species[obj.outputSpecies].aminoToCodon
            
            // intermediate amino acid representation
            let outputSequence = new Array(Math.floor(obj.sequence.length / 3))
            for (var j = 0, k = 0, jlen = Math.floor(obj.sequence.length / 3); j < jlen; ++j, k += 3) {
                outputSequence[j] = outputSpeciesAminoToCodon[obj.sequence[j]]
            }
            
            // if the user wants the sequence returned as RNA, we already have it so simply provide it.
            if (outputType === "RNA") {
                // provide the output
                if (typeof cb === "function") {
                    cb(null, outputSequence.join(""))
                }
                else {
                    return {
                        err: null,
                        sequence: outputSequence.join("")
                    }
                }
            } else if (outputType === "DNA") {
                // the user wants the sequence returned as DNA, so we need to convert the RNA to a DNA sequence,
                // and then return it.
                module.export.RNAToDNA({
                    speciesName: obj.speciesName,
                    sequence: outputSequence.join("")
                }, (err, DNA) => {
                    // provide the output
                    if (typeof cb === "function") {
                        cb(null, DNA);
                    }
                    else {
                        return {
                            err: null,
                            sequence: DNA
                        }
                    }
                })
            }
        }
    }
}
