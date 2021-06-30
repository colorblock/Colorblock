pact -u deploy-colorblock-poly-fungible-v1.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock-fungible-util.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock-market.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
pact -u deploy-colorblock-gas-station.yaml | pact add-sig ~/colorblock-create-coin/colorblock-admin_keys.yaml | curl -H "Content-Type: application/json" -d @- https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send
echo
