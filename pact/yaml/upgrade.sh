pact -a upgrade-colorblock.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a upgrade-cbmarket.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
