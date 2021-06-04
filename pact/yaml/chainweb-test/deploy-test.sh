pact -u deploy-colorblock-test.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin-test_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock-market-test.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin-test_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock-gas-station-test.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin-test_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
