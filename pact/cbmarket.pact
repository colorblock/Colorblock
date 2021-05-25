(define-keyset 'cbmarket-admin-keyset (read-keyset "cbmarket-admin-keyset"))
(module cbmarket GOVERNANCE
  @doc "module for \
      \1. helping users release items into market for sale \
      \2. supporting pricing and trading efficiently. "

  (use colorblock)

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
    (enforce-keyset 'cbmarket-admin-keyset)
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
    (enforce-unit token amount)
    (let 
      ((balance (colorblock.get-balance token seller)))
      (enforce 
        ( > 
          balance
          0.0
        )
        "Seller has no balance of this token"
      )
      (enforce 
        ( <= 
          balance
          amount
        )
        "Amount can't be larger than balance"
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
      { "on-sale" := on-sale }
      (enforce
        (= true on-sale)
        "Item is not on sale"
      )
    )
  )

  (defcap PURCHASE:bool 
    ( token:string
      buyer:string 
      seller:string
    )
    @doc "Notifies purchase of TOKEN from SELLER to BUYER"
    @event
    (with-read deals (key token seller)
      { 
        "on-sale" := on-sale
      }
      (enforce
        (!= seller buyer)
        "Buyer cannot be seller"
      )
      (enforce
        (= true on-sale)
        "Item is not on sale"
      )
    )
  )


  ; -------------------------------------------------------
  ; Constants

  (defconst DEFAULT_TOKEN "cb-token"
    "The default token for official account init"
  )
  (defconst COLORBLOCK_MARKET "colorblock-market"
    "The official account of colorblock market"
  )

  (defconst FEES_RATE 0.01
    "The rate of fees that platform taking"
  )


  ; -------------------------------------------------------
  ; Marketing Functions

  (defun cb-market-guard ()
    (create-module-guard 'cbmarket-guard)
  )

  (defun release:string
    ( token:string
      account:string
      price:decimal
      amount:decimal
    )
    @doc " Release item for sale."
    (with-capability (RELEASE token account price amount)
      (install-capability (colorblock.TRANSFER token account COLORBLOCK_MARKET amount))
      (colorblock.transfer-create token account COLORBLOCK_MARKET (cb-market-guard) amount)
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
     true
    )
  )

  (defun purchase-with-new-user:string 
    ( account:string
      token:string
      guard:guard
    )
    @doc " Create account and purchase item"
    (colorblock.create-account-maybe account guard)
    (purchase account token)
  )

  (defun purchase:string 
    ( account:string
      token:string
    )
    @doc " Purchase item."
    (with-capability (PURCHASE account token)
      (with-read deals token
        { "seller" := seller,
          "price" := price
        }
        (let* 
          (
            (fees (* FEES_RATE price))
            (total-price (+ fees price))
            (balance (coin.get-balance account))
          )
          (enforce 
            (<= total-price balance)
            "Insufficient balance"
          )
          (install-capability (coin.TRANSFER account seller price))
          (install-capability (coin.TRANSFER account COLORBLOCK_MARKET fees))
          (install-capability (colorblock.MINT token COLORBLOCK_MARKET))
          (install-capability (TRANSFER COLORBLOCK_MARKET account token))
          (coin.transfer account seller price)
          (coin.transfer account COLORBLOCK_MARKET fees)
          (transfer COLORBLOCK_MARKET account token)
          (update deals token {
            "on-sale": false
          })
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
    (coin.create-account COLORBLOCK_MARKET (cb-market-guard))
  )

)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table deals)
    (init-market-account)
  ]
)
