pact -a deploy-fungible.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a deploy-coin.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a deploy-non-fungible.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a deploy-colorblock.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a deploy-cbmarket.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo

pact -a send1.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local1.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send2.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local2.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send3.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local3.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send4.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local4.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send5.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local4.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send6.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local4.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send4.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local4.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local
echo
pact -a send7.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -a local4.yaml -l | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/local

