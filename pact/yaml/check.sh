pact -a check-result.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
