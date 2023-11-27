# Nmemonica service (Local Development)

Service for testing and developing the UI locally.

## Note:
This app is a PWA and uses the Service Worker API [(MDN docs)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) which is only enabled over HTTPS.

To run the service over HTTPS self signed CA must be used.

## Generate self signed CA


## Build and start
```bash
# to build the service
npm run service:b
# to start the service
npm run service
```

## Service endpoints
- /DATA_PATH/:data.json ex: localhost:8000/lambda/vocabulary.json
- /AUDIO_PATH/ ex: localhost:8000/g_translate_pronounce?tl=ja&q=友達
- /SHEET_PATH/ ex: localhost:8000/workbook/getData
