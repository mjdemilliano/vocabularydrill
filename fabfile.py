from fabric.api import run
import tools.ods2json

input_ods = 'woordenlijst.ods'
output_json = 'woordenlijst.json'

def generate_json():
    with open(output_json, 'w') as outputFile:
        tools.ods2json.generateJSONForODSFile(input_ods, outputFile)


