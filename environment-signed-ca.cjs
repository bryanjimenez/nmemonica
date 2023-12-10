const fs = require("fs");
const path = require("path");
const spawnSync = require("child_process").spawnSync;
const lan = require("./environment-host.cjs").lan;
require("dotenv").config();


const projectRoot = path.resolve();
const keyDir = process.env.PATH_CA;

const hasSelfSignedCertificateAuthority = ()=>{
  if (
    fs.existsSync(`${projectRoot}/${keyDir}/${process.env.CA_KEY}`) &&
    fs.existsSync(`${projectRoot}/${keyDir}/${process.env.CA_CRT}`)
  ) {
    return true;
  }

  return false;
}



const cwd = `${projectRoot}/${process.env.PATH_CA}`;


/**
 * This script creates a self signed End entity and Root CA (cert+key) pair
 */

const host=lan.hostname
const ip=lan.address
const AppName="Nmemonica"


// #emailAddress=nobody@email.com
const commonName=`${AppName} Root Certificate Authority`
const OU="nmemonica"
const O=`${AppName} DEV`
// const L="City"
// const ST="State"
const country="US"

const rootKey = "rootkey.pem";      // key
const rootCRT = "root.pem";         // certificate
const rootCNF = "root.openssl.cnf"; // extensions file
const rootCSR = "root.csr";         // certificate sign request

const eeKey = process.env.CA_KEY    // "eekey.pem";
const eecrt = process.env.CA_CRT    // "ee.pem";
const eeCNF = "ee.openssl.cnf";
const eeCSR = "ee.csr";



/**
 * Root Certificate Authority
 */
function buildRootCertificate(){
  // generate rootkey.pem
  spawnSync('openssl', ['ecparam', "-out", rootKey, "-name", "secp384r1", "-genkey"], {cwd});

  // generate root.csr
  spawnSync('openssl', ["req", "-new", "-key", rootKey, "-days", "5480", "-extensions", "v3_ca", "-batch", "-out", rootCSR, "-utf8", "-subj", `/C=${country}/O=${O}/CN=${commonName}`], {cwd});

  // create Root extensions file root.openssl.cnf
  const rootCNFString =
  `basicConstraints = critical, CA:TRUE\n
  keyUsage = keyCertSign, cRLSign\n
  subjectKeyIdentifier = hash\n
  nameConstraints = permitted;IP:${ip}/255.255.255.0,permitted;DNS:${host}`
  fs.writeFileSync(`${cwd}/${rootCNF}`, rootCNFString);

  // generate ROOT signed CSR (root.pem) w/ root.openssl.cnf
  spawnSync('openssl', ["x509", "-req", "-sha384", "-days", "3650", "-in", rootCSR, "-signkey", rootKey, "-extfile", rootCNF, "-out", rootCRT], {cwd});
}


/**
 * End Entity Certificate
 */
function buildEndEntityCertificate(){
  if(eeKey===undefined||eecrt===undefined){
    throw new Error("Dot env file missing key crt names")
  }

  // generate eekey.pem
  spawnSync('openssl', ['ecparam', "-out", eeKey, "-name", "secp384r1", "-genkey"], {cwd});

  // generate EE Certificate Signing Request (csr)
  spawnSync('openssl', ["req", "-new", "-key", eeKey, "-days", "1096", "-extensions", "v3_ca", "-batch", "-out", eeCSR, "-utf8", "-subj", `/O=${O}/CN=${AppName} development`], {cwd});

  // create End Entity extensions file ee.openssl.cnf
  const eeCNFString =
  `basicConstraints = CA:FALSE\n
  subjectAltName = IP:${ip}, DNS:${host}\n
  extendedKeyUsage = serverAuth`
  fs.writeFileSync(`${cwd}/${eeCNF}`, eeCNFString);

  // generate End Entity signed CSR (ee.pem) w/ ee.openssl.cnf
  spawnSync('openssl', ["x509", "-req", "-sha384", "-days", "1096", "-in", eeCSR, "-CAkey", rootKey, "-CA", rootCRT, "-extfile", eeCNF, "-out", eecrt], {cwd});
}

function create(){
  console.log("IP: "+ip)
  console.log("Hostname: "+host)

  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  // Delete old files
  [eecrt, eeKey, eeCSR, eeCNF, rootCRT, rootKey, rootCSR, rootCNF].forEach((file)=>{
    fs.rm(`${cwd}/${file}`,(err)=>{
      // console.log(err);
    })
  })

  buildRootCertificate();
  buildEndEntityCertificate()
}


if(require.main?.loaded === false){
  // running from cli
  create()
}


module.exports = {
  /** If it has been previously created */
  exists: hasSelfSignedCertificateAuthority,
  create
};
