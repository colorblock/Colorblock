pact -u deploy-namespace.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-fungible.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-coin.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-poly-fungible.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-fungible-util.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-colorblock.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u deploy-colorblock-market.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo

