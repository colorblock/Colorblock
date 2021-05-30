pact -u post-create-coin.yaml | pact add-sig test-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u post-create-item.yaml | pact add-sig test-bob_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u post-release.yaml | pact add-sig test-bob_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u post-recall.yaml | pact add-sig test-bob_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo
pact -u post-purchase.yaml | pact add-sig test-alice_keys.yaml | curl -H "Content-Type: application/json" -d @- http://localhost:8080/api/v1/send
echo

