pact -u upgrade-colorblock.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u upgrade-colorblock-market.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
