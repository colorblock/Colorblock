(namespace (read-msg 'ns))

(module colorblock-market-test GOVERNANCE
  @doc "module for \
      \1. helping users release items into market for sale \
      \2. supporting pricing and trading efficiently. "

  (use coin [ details ])
  (use colorblock-test "gorTysAQAGOjgFD8444A91NXUr-b4FSyMgtWhtXq-UE")

  ; -------------------------------------------------------
  ; Schemas and Tables

  (defschema deal-schema
    @doc  " Record every deal of token in market \
          \ Column definitions: \
          \   @key: the combined key token:account for index \
          \   token: the token asset id \
          \   seller: current seller \
          \   price: item price \
          \   total: total amount \
          \   remain: remain amount \
          \   open: true - open, false - close "
    token:string
    seller:string
    price:decimal
    total:decimal
    remain:decimal
    open:bool
  )

  (deftable deals:{deal-schema})


  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin "
    (enforce-guard (at 'guard (coin.details "colorblock-admin-test")))
  )

  (defcap RELEASE:bool 
    ( token:string
      seller:string 
      price:decimal
      amount:decimal
    )
    @doc "Notifies release of TOKEN owned by SELLER, partially or fully"
    @event

    (enforce 
      (< 0.0 price)
      "Price must larger than zero"
    )
    (valid-price-precision price)
    (enforce-unit token amount)

    (let 
      ((balance (colorblock-test.get-balance token seller)))
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
    (with-default-read deals (key token seller)
      { "open" : false }
      { "open" := open }
      (enforce
        (= false open)
        "Item is already on sale"
      )
    )
  )

  (defcap RECALL:bool 
    ( token:string
      seller:string 
    )
    @doc "Notifies recall of TOKEN owned by SELLER"
    @event

    (with-read deals (key token seller)
      { "open" := open }
      (enforce
        (= true open)
        "Deal status is closed"
      )
    )
  )

  (defcap PURCHASE:bool 
    ( token:string
      buyer:string 
      seller:string
      price:decimal
      amount:decimal
    )
    @doc "Notifies purchase of TOKEN from SELLER to BUYER"
    @event

    (enforce-unit token amount)
    (with-read deals (key token seller)
      { "remain" := remain,
        "open" := open,
        "price" := sale-price
      }
      (enforce
        (= sale-price price)
        "Purchase price must equal sale-price"
      )
      (enforce
        (<= amount remain)
        "Purchase amount cannot be larger than remain amount"
      )
      (enforce
        (!= seller buyer)
        "Buyer cannot be seller"
      )
      (enforce
        (= true open)
        "Deal status is closed"
      )
    )
  )


  ; -------------------------------------------------------
  ; Constants

  (defconst COLORBLOCK_MARKET_POOL "colorblock-market-pool-test"
    "The official account of colorblock market pool-test"
  )

  (defconst FEES_RATE 0.01
    "The rate of fees that platform taking"
  )

  (defconst PRICE_PRECISION 12
    "The precision of sale price"
  )

  ; -------------------------------------------------------
  ; Constants

  (defun valid-price-precision (amount:decimal)
    (enforce
      (= (floor amount PRICE_PRECISION) amount)
      "precision violation"
    )
  )


  ; -------------------------------------------------------
  ; Marketing Functions

  (defun colorblock-market-guard ()
    (create-module-guard 'colorblock-market-guard)
  )

  (defun release:string
    ( token:string
      account:string
      price:decimal
      amount:decimal
    )
    @doc " Release item for sale."
    (with-capability (RELEASE token account price amount)
      ; Transfer token to platform
      (install-capability (colorblock-test.TRANSFER token account COLORBLOCK_MARKET_POOL amount))
      (colorblock-test.transfer-create token account COLORBLOCK_MARKET_POOL (colorblock-market-guard) amount)
      (write deals (key token account) {
        "token" : token,
        "seller" : account,
        "price" : price,
        "total" : amount,
        "remain" : amount,
        "open" : true
      })
    )
  )

  (defun recall:string
    ( token:string
      account:string
    )
    @doc " Recall item and stop selling."
    (with-capability (RECALL token account)
      (let* 
        (
          (deal (read deals (key token account)))
          (remain-amount (at 'remain deal))
        )
        ; Check ownership
        (install-capability (colorblock-test.AUTH token account))
        (validate-ownership token account)

        ; Transfer token back
        (if
          (>
            remain-amount
            0.0
          )
          [
            (install-capability (colorblock-test.TRANSFER token COLORBLOCK_MARKET_POOL account remain-amount))
            (colorblock-test.transfer token COLORBLOCK_MARKET_POOL account remain-amount)
          ]
          "no need to transfer token"
        )
        (update deals (key token account) {
          "total": 0.0,
          "remain": 0.0,
          "open": false
        })
      )
    )
  )

  (defun purchase-new-account:string
    ( token:string
      buyer:string
      seller:string
      price:decimal
      amount:decimal
      guard:guard
    )
    @doc " Create account and purchase item"
    (colorblock-test.create-account-maybe token buyer guard)
    (purchase token buyer seller price amount)
  )

  (defun purchase:string 
    ( token:string
      buyer:string
      seller:string
      price:decimal
      amount:decimal
    )
    @doc " Purchase item."

    ; validate receiver first
    (install-capability (colorblock-test.AUTH token buyer))
    (validate-ownership token buyer)

    (with-capability (PURCHASE token buyer seller price amount)
      (with-read deals (key token seller)
        { "remain" := remain-amount
        }
        (let* 
          (
            (payment (* price amount))
            (fees (* FEES_RATE payment))
            (total-pay (+ fees payment))
            (balance (coin.get-balance buyer))
            (left-amount (- remain-amount amount))
          )
          (enforce 
            (<= total-pay balance)
            "Insufficient balance"
          )
          (install-capability (coin.TRANSFER buyer seller payment))
          (install-capability (coin.TRANSFER buyer COLORBLOCK_MARKET_POOL fees))
          (install-capability (colorblock-test.TRANSFER token COLORBLOCK_MARKET_POOL buyer amount))
          (coin.transfer buyer seller payment)
          (coin.transfer buyer COLORBLOCK_MARKET_POOL fees)
          (colorblock-test.transfer token COLORBLOCK_MARKET_POOL buyer amount)
          (update deals (key token seller) {
            "remain": left-amount
          })
          (if
            (= 0.0 left-amount)
            (update deals (key token seller) {
              "open": false
            })
            "no need to close deal"
          )
        )
      )
    )
  )

  (defun item-sale-status:{deal-schema} (token:string account:string)
    (read deals (key token account))
  )


  ; -------------------------------------------------------
  ; Utility Functions

  (defun init-market-account ()
    @doc " Create market account with module guard."
    (coin.create-account COLORBLOCK_MARKET_POOL (colorblock-market-guard))
  )

  (defun deal-details (key:string)
    (read deals key)
  )

  ; -------------------------------------------------------
  ; Transaction Logs
  (defun deals-txlog (tx-id:integer)
    (map (at 'key) (txlog deals tx-id))
  )
  (defun all-txlog (tx-id:integer)
    {
      "tx-id": tx-id,
      "items": (colorblock-test.items-txlog tx-id),
      "ledger": (colorblock-test.ledger-txlog tx-id),
      "deals": (deals-txlog tx-id)
    }
  )
  (defun all-txlogs (tx-ids:[decimal])
    (map (all-txlog) (map (floor) tx-ids))
  )

)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table deals)
    (init-market-account)
  ]
)
