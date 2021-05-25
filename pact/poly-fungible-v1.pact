(enforce-pact-version "3.7")

(namespace (read-msg 'ns))

(interface poly-fungible-v1

  (defschema account-details
    @doc
      " Account details: token ID, account name, balance, and guard."
    token:string
    account:string
    balance:decimal
    guard:guard)

)
