import json
import ODSReader
import sys

class VocabularyReader(object):

    def __init__(self, path):
        self._doc = ODSReader.ODSReader(path)
        self._table = self._doc.getSheet('Sheet1')
        self.vocabulary = {}
        self._currentSection = None
        self.read()

    def _foundSection(self, section):
        self._currentSection = section
        #print u'section = ' + section

    def _foundWord(self, lang1, lang2):
        if self._currentSection:
            if self._currentSection not in self.vocabulary:
                self.vocabulary[self._currentSection] = []
            self.vocabulary[self._currentSection].append([lang1, lang2])
            #print u'word = ' + lang1

    def read(self):
        for row in self._table:
            if len(row) >= 3:
                self._foundSection(row[0])
            if len(row) >= 2:
                self._foundWord(row[-2], row[-1])
    
    def saveAsJSON(self, fileObject):
        json.dump(self.vocabulary, fileObject)

def generateJSONForODSFile(odsFile, outputFilePointer):
    reader = VocabularyReader(odsFile)
    reader.saveAsJSON(outputFilePointer)
    
def main():
    odsFile = sys.argv[1]
    outputFile = sys.argv[2] if len(sys.argv) > 2 else None
    outputFilePointer = open(outputFile, 'w') if outputFile else sys.stdout

if __name__ == '__main__':
    main()
