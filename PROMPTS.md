# Session Prompts Log

### Prompt 1
```text
build a sg base bus arrival application that tracks real time bus locations and provides accurate wait time predictions for all LTA bus stops. 

build just the front end for now, i will include the backend connection later.
```

---

### Prompt 2
```text
Git push https://<GITHUB_ACCESS_TOKEN>@https://github.com/coniecchin/lta-bus-arrival.git
```
*(Token redacted for security)*

---

### Prompt 3
```text
add a serverless connection that pulls live data from LTA Datamall using the following endpoints: 

- store this in /api folder (project root level) not the scr folder
- include /health.ts and /busarrival.ts within that subfolder
- do not hardcode any key, I will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

---

### Prompt 4
```text
collect all the prompts that have been written in a empty file
```
