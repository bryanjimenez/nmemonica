# [Nmemonica](https://bryanjimenez.github.io/nmemonica)
>English - Japanese language learning app  

>Note:
Nmemonica is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.  
Nmemonica uses local storage and indexedDB (cookie technologies) to store user app data.

This repo contains the UI's source code for [Nmemonica](https://bryanjimenez.github.io/nmemonica). The service documentation can be found here ([snservice](https://github.com/bryanjimenez/snservice/blob/main/README.md)).


## Installation (for development)
### *Prerequisites*
1. [Git](https://git-scm.com/)
1. [Node](https://nodejs.org)
1. *[OpenSSL](https://openssl.org) (if using @nmemonica/snservice)*

### App (website/PWA)
1. `git clone https://github.com/bryanjimenez/nmemonica.git` 
1. `cd ./nmemonica`
1. `npm install`

>Note: [@nmemonica/snservice](https://github.com/bryanjimenez/snservice) (local development service) is installed as a dependency which enables:  
Testing and backing up your data locally.  
Editing your datasets on a desktop and viewing the app on a mobile device. See [snservice README.md](https://github.com/bryanjimenez/snservice/blob/main/README.md)

### Running locally
1. `npm run service`
1. `npm run start`
1. Open a browser to https://localhost:8080


## Thanks
 - http://www.japaneseverbconjugator.com/
 - https://translate.google.com/
