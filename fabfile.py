from fabric.api import run, task
import tools.ods2json
import ftplib
import netrc

input_ods = 'woordenlijst.ods'
output_json = 'woordenlijst.json'
FTP_SETTINGS = {
    'host': 'ftp.millibyte.nl',
    'remote_directory': '/flashcard',
    'files': [
        'index.html',
        'woordenlijst.json',
        'vocabularydrill.js',
        'vocabularydrill.css',
    ]
}

@task
def generate_json():
    with open(output_json, 'w') as outputFile:
        tools.ods2json.generateJSONForODSFile(input_ods, outputFile)

@task
def update():
    """Uploads files to the remote FTP server."""
    # Read netrc file.
    netrc_file = netrc.netrc()
    host = FTP_SETTINGS['host']
    credentials = netrc_file.authenticators(host)
    if not credentials:
        raise Exception('Cannot find credentials for host {} in netrc file (~/.netrc)'.format(host))
    login, account, password = credentials
    # Open FTP connection.
    print "Connecting to " + host
    ftp = ftplib.FTP(host, login, password)
    print "Connected to " + host
    ftp.cwd(FTP_SETTINGS['remote_directory'])
    print "Changed to " + ftp.pwd()
    for filename in FTP_SETTINGS['files']:
        print "Uploading " + filename
        ftp.storbinary('STOR {}'.format(filename), open(filename, 'rb'))
    print "Closing connection"
    ftp.close()

