(namespace (read-msg 'ns))

(module colorblock-market-test GOVERNANCE
  @doc "module for \
      \1. helping users release items into market for sale \
      \2. supporting pricing and trading efficiently. "

  (use coin [ details ])
  (use colorblock-test "1Ki3fyKdZgREgWboF7GfWuZbfii5d0IZszk5hGI3WvI")

  ; -------------------------------------------------------
  ; Schemas and Tables

  (defschema item-deposit-schema
    @doc  " Record deposit of colorblock item into pool \
          \ Column definitions: \
          \   @key: the combined key token:account \
          \   token: the token id \
          \   account: owner of deposit \
          \   amount: deposit amount of item "
    token:string
    account:string
    amount:decimal
  )

  (deftable item-deposits:{item-deposit-schema})

  (defschema coin-deposit-schema
    @doc  " Record deposit of KDA coin into pool \
          \ Column definitions: \
          \   @key: account, the owner of deposit \
          \   amount: deposit amount of coin "
    amount:decimal
  )

  (deftable coin-deposits:{coin-deposit-schema})

  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin "
    (enforce-guard (at 'guard (coin.details "colorblock-admin-test")))
  )

  (defcap MANAGER ()
    @doc " Only support executed by manager "
    (enforce-guard (at 'guard (coin.details COLORBLOCK_MARKET_MANAGER)))
  )

  (defcap AUTH-M:bool (account:string)
    @doc " Enforce requester having the ownership of account in KDA network. \
         \ Add M to distinguish from colorblock.AUTH "
    (enforce-guard (at 'guard (coin.details account)))
  )

  (defcap DEPOSIT-ITEM:bool 
    ( token:string
      account:string 
      amount:decimal
    )
    @doc "Validate capabilities for deposit TOKEN "
    @managed amount AMOUNT-mgr

    (compose-capability (MANAGER))
    (compose-capability (AUTH-M account))

    (enforce-unit token amount)

    (let 
      ((balance (colorblock-test.get-balance token account)))
      (enforce 
        ( > 
          balance
          0.0
        )
        "Seller has no balance of this token"
      )
      (enforce 
        ( <= 
          amount
          balance
        )
        "Amount must not exceed balance"
      )
    )
  )

  (defcap DEPOSIT-COIN:bool 
    ( account:string 
      amount:decimal
    )
    @doc "Validate capabilities for deposit KDA coin "
    @managed amount AMOUNT-mgr

    (compose-capability (MANAGER))
    (compose-capability (AUTH-M account))

    (let 
      ((balance (coin.get-balance account)))
      (enforce 
        ( > 
          balance
          0.0
        )
        "Seller has no balance of this token"
      )
      (enforce 
        ( <= 
          amount
          balance
        )
        "Amount must not exceed balance"
      )
    )
  )

  (defcap WITHDRAWL-ITEM:bool 
    ( token:string
      account:string
      amount:decimal
    )
    @doc "Validate capabilities for withdrawl item "
    @managed amount AMOUNT-mgr

    (compose-capability (MANAGER))
    (compose-capability (AUTH-M account))

    (enforce-unit token amount)

    (with-read item-deposits (key token account)
      { "amount" := remaining }
      (enforce
        (<= amount remaining )
        "Withdrawl amount can not exceed deposit remaining amount"
      )
    )
  )

  (defcap WITHDRAWL-COIN:bool 
    ( account:string
      amount:decimal
    )
    @doc "Validate capabilities for withdrawl KDA coin "
    @managed amount AMOUNT-mgr

    (compose-capability (MANAGER))
    (compose-capability (AUTH-M account))

    (with-read coin-deposits account
      { "amount" := remaining }
      (enforce
        (<= amount remaining )
        "Withdrawl amount can not exceed deposit remaining amount"
      )
    )
  )

  (defcap PURCHASE:bool 
    ( token:string
      buyer:string 
      seller:string
      amount:decimal
      payment:decimal
      fees:decimal
    )
    @doc "Validate capabilities for purchase token "
    @managed amount AMOUNT-mgr

    (compose-capability (MANAGER))
    (compose-capability (AUTH-M buyer))
    (compose-capability (CREDIT-ITEM buyer))

    (enforce-unit token amount)
    (with-read item-deposits (key token seller)
      { "amount" := remaining }
      (enforce
        (<= amount remaining)
        "Purchase amount cannot exceed remaining amount"
      )
      (enforce
        (!= seller buyer)
        "Buyer cannot be seller"
      )
    )
  )

  (defcap CREDIT-ITEM (account:string)
    @doc " Required capability in PURCHASE "
    true
  )

  (defun AMOUNT-mgr:decimal
    ( managed:decimal
      requested:decimal
    )
    @doc " Manages ACTIONS cap AMOUNT where MANAGED is the installed quantity \
         \ and REQUESTED is the quantity attempting to be granted."
    (let ((newbal (- managed requested)))
      (enforce (>= newbal 0.0)
        (format "ACTION exceeded for balance {}" [managed])
      )
      newbal
    )
  )


  ; -------------------------------------------------------
  ; Constants

  (defconst COLORBLOCK_MARKET_POOL "colorblock-market-pool-test"
    "The official account as transfer station "
  )
  (defconst COLORBLOCK_MARKET_MANAGER "colorblock-market-manager-test"
    "The official account as fees receiver and also command sender "
  )


  ; -------------------------------------------------------
  ; Deposit Functions

  (defun deposit-item:string
    ( token:string
      account:string
      amount:decimal
    )
    (with-capability (DEPOSIT-ITEM token account amount)
      ; Transfer token to pool
      (install-capability (colorblock-test.TRANSFER token account COLORBLOCK_MARKET_POOL amount))
      (colorblock-test.transfer-create token account COLORBLOCK_MARKET_POOL (colorblock-market-guard) amount)
      ; Update ledger
      (with-default-read item-deposits (key token account)
        { "amount" : 0.0 }
        { "amount" := existed }
        (write item-deposits (key token account) {
          "token" : token,
          "account" : account,
          "amount" : (+ existed amount)
        })
      )
    )
  )

  (defun deposit-coin:string
    ( account:string
      amount:decimal
    )
    (with-capability (DEPOSIT-COIN account amount)
      ; Transfer coin to pool
      (install-capability (coin.TRANSFER account COLORBLOCK_MARKET_POOL amount))
      (coin.transfer account COLORBLOCK_MARKET_POOL amount)
      ; Update ledger
      (with-default-read coin-deposits account
        { "amount" : 0.0 }
        { "amount" := existed }
        (write coin-deposits account {
          "amount" : (+ existed amount)
        })
      )
    )
  )

  (defun withdrawl-item:string
    ( token:string
      account:string
      amount:decimal
    )

    (with-capability (WITHDRAWL-ITEM token account amount)

      ;(colorblock-test.valid-own-item token account)
      ; Update ledger
      (with-default-read item-deposits (key token account)
        { "amount" : 0.0 }
        { "amount" := existed }
        (write item-deposits (key token account) {
          "token" : token,
          "account" : account,
          "amount" : (- existed amount)
        })
      )
      ; Transfer token from pool to account
      (install-capability (colorblock-test.TRANSFER token COLORBLOCK_MARKET_POOL account amount))
      (colorblock-test.transfer token COLORBLOCK_MARKET_POOL account amount)
    )
  )

  (defun withdrawl-coin:string
    ( account:string
      amount:decimal
    )
    (with-capability (WITHDRAWL-COIN account amount)
      ; Update ledger
      (with-default-read coin-deposits account
        { "amount" : 0.0 }
        { "amount" := existed }
        (write coin-deposits account {
          "amount" : (- existed amount)
        })
      )
      ; Transfer coin from pool to account
      (install-capability (coin.TRANSFER COLORBLOCK_MARKET_POOL account amount))
      (coin.transfer COLORBLOCK_MARKET_POOL account amount)
    )
  )

  (defun credit-item:string
    ( token:string
      sender:string
      receiver:string
      amount:decimal
    )
    (require-capability (CREDIT-ITEM receiver))

    ; Update ledger
    (with-default-read item-deposits (key token sender)
      { "amount" : 0.0 }
      { "amount" := existed }
      (write item-deposits (key token sender) {
        "token" : token,
        "account" : sender,
        "amount" : (- existed amount)
      })
    )
    ; Transfer token from pool to receiver
    (install-capability (colorblock-test.TRANSFER token COLORBLOCK_MARKET_POOL receiver amount))
    (colorblock-test.transfer token COLORBLOCK_MARKET_POOL receiver amount)
  )

  (defun purchase:string
    ( token:string
      buyer:string
      seller:string
      amount:decimal
      payment:decimal
      fees:decimal
    )
    @doc " Create ledger and purchase item. "

    (with-capability (PURCHASE token buyer seller amount payment fees)
      (install-capability (coin.TRANSFER buyer seller payment))
      (install-capability (coin.TRANSFER buyer COLORBLOCK_MARKET_MANAGER fees))
      (coin.transfer buyer seller payment)
      (coin.transfer buyer COLORBLOCK_MARKET_MANAGER fees)
      (credit-item token seller buyer amount)
    )
  )

  
  (defun item-deposit-details (token:string account:string)
    (read item-deposits (key token account))
  )
  (defun coin-deposit-details (account:string)
    (read coin-deposits account)
  )


  ; -------------------------------------------------------
  ; Utility Functions

  (defun init-market-account ()
    @doc " Create market account with module guard."
    (coin.create-account COLORBLOCK_MARKET_POOL (colorblock-market-guard))
  )

  (defun colorblock-market-guard ()
    (create-module-guard 'colorblock-market-guard)
  )


  ; -------------------------------------------------------
  ; Transaction Logs
  (defun item-deposits-txlog (tx-id:integer)
    (map (at 'key) (txlog item-deposits tx-id))
  )
  (defun coin-deposits-txlog (tx-id:integer)
    (map (at 'key) (txlog coin-deposits tx-id))
  )

  (defun all-txlog (tx-id:integer)
    {
      "tx-id": tx-id,
      "items": (colorblock-test.items-txlog tx-id),
      "ledger": (colorblock-test.ledger-txlog tx-id),
      "item-deposits": (item-deposits-txlog tx-id),
      "coin-deposits": (coin-deposits-txlog tx-id)
    }
  )
  (defun all-txlogs (tx-ids:[decimal])
    (map (all-txlog) (map (floor) tx-ids))
  )

)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table item-deposits)
    (create-table coin-deposits)
    (init-market-account)
  ]
)
