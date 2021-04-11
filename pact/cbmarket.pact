(define-keyset 'cbmarket-admin-keyset (read-keyset "cbmarket-admin-keyset"))
(module cbmarket GOVERNANCE
  @doc "module for \
      \1. helping users release items into market for sale \
      \2. supporting pricing and trading efficiently. "

  (use colorblock)

  ; -------------------------------------------------------
  ; Schemas and Tables

  (defschema shelf-schema
    @doc  " Record item status in market \
          \ Column definitions: \
          \   item-id @key: id of item \
          \   seller: current seller \
          \   on-sale: selling status \
          \   price: item price"
    seller:string
    on-sale:bool
    price:decimal
  )

  (deftable shelves:{shelf-schema})

  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin "
    (enforce-keyset 'cbmarket-admin-keyset)
  )

  (defcap RELEASE:bool 
    (
      seller:string 
      item-id:string
      price:decimal
    )
    @doc "Notifies release of ITEM-ID owned by SELLER"
    @event
    (enforce 
      (< 0.0 price)
      "Price must larger than zero"
    )
    (bind (item-details item-id)
      { "owner" := owner }
      (enforce
        (= owner seller)
        "Seller is not owner"
      )
      (with-default-read shelves item-id
        { "on-sale" : false }
        { "on-sale" := on-sale }
        (enforce
          (= false on-sale)
          "Item is already on sale"
        )
      )
    )
  )

  (defcap MODIFY:bool 
    (
      seller:string 
      item-id:string
      price:decimal
    )
    @doc "Notifies modification of ITEM-ID owned by SELLER"
    @event
    (enforce 
      (< 0.0 price)
      "Price must larger than zero"
    )
    (with-read shelves item-id
      { "on-sale" := on-sale,
        "seller" := cur-seller
      }
      (enforce
        (= true on-sale)
        "Item is not on sale"
      )
      (enforce
        (= cur-seller seller)
        "Account is not seller"
      )
    )
  )

  (defcap RECALL:bool 
    (
      seller:string 
      item-id:string
    )
    @doc "Notifies recall of ITEM-ID owned by SELLER"
    @event
    (with-read shelves item-id
      { "seller" := cur-seller,
        "on-sale" := on-sale
      }
      (enforce
        (= true on-sale)
        "Item is not on sale"
      )
      (enforce
        (= cur-seller seller)
        "Account is not seller"
      )
    )
  )

  (defcap PURCHASE:bool 
    (
      buyer:string 
      item-id:string
    )
    @doc "Notifies purchase of ITEM-ID from BUYER"
    @event
    (with-read shelves item-id
      { "seller" := cur-seller,
        "on-sale" := on-sale
      }
      (enforce
        (!= cur-seller buyer)
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

  (defconst COLORBLOCK_MARKET "colorblock-market"
    "The official account of colorblock market"
  )

  (defconst FEES_RATE 0.01
    "The rate of fees that platform taking"
  )


  ; -------------------------------------------------------
  ; Marketing Functions

  (defun release:string
    ( account:string
      item-id:string
      price:decimal
    )
    @doc " Release item for sale."
    (with-capability (RELEASE account item-id price)
      (install-capability (colorblock.TRANSFER account COLORBLOCK_MARKET item-id))
      (colorblock.transfer account COLORBLOCK_MARKET item-id)
      (write shelves item-id {
        "seller" : account,
        "on-sale" : true,
        "price" : price
      })
    )
  )

  (defun modify:string
    ( account:string
      item-id:string
      price:decimal
    )
    @doc " Modify item by price."
    (with-capability (MODIFY account item-id price)
      (install-capability (colorblock.OWN-ACCOUNT account))
      (colorblock.validate-owner account)
      (update shelves item-id {
        "price" : price
      })
    )
  )

  (defun recall:string
    ( account:string
      item-id:string
    )
    @doc " Recall item and stop selling."
    (with-capability (RECALL account item-id)
      (install-capability (colorblock.OWN-ACCOUNT COLORBLOCK_MARKET))
      (install-capability (TRANSFER COLORBLOCK_MARKET account item-id))
      (transfer COLORBLOCK_MARKET account item-id)
      (update shelves item-id {
        "on-sale": false
      })
    )
  )

  (defun purchase:string 
    ( account:string
      item-id:string
    )
    @doc " Purchase item."
    (with-capability (PURCHASE account item-id)
      (with-read shelves item-id
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
          (install-capability (colorblock.OWN-ACCOUNT COLORBLOCK_MARKET))
          (install-capability (TRANSFER COLORBLOCK_MARKET account item-id))
          (coin.transfer account seller price)
          (coin.transfer account COLORBLOCK_MARKET fees)
          (transfer COLORBLOCK_MARKET account item-id)
          (update shelves item-id {
            "on-sale": false
          })
        )
      )
    )
  )

  (defun on-sale-items:[object:{item-schema}] ()
    (select shelves (constantly true))
  )

  (defun item-sale-status:{shelf-schema} (id:string)
    (+ {'id: id} (read shelves id))
  )


  ; -------------------------------------------------------
  ; Utility Functions

  (defun init-market-account ()
    @doc " Create market account with module guard."
    (let ((market-guard (create-module-guard 'cbmarket-admin-keyset)))
      (coin.create-account COLORBLOCK_MARKET market-guard)
      (create-account COLORBLOCK_MARKET market-guard)
    )
  )

)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table shelves)
    (init-market-account)
  ]
)
