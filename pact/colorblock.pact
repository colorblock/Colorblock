(namespace (read-msg 'ns))

(module colorblock GOVERNANCE
  @doc "module for \
      \1. creating colorblock user \
      \2. creating/transfering colorblock items"

  (use coin [ details ])
  (use colorblock-fungible-util)
  (implements colorblock-poly-fungible-v1)

  ; -------------------------------------------------------
  ; Schemas and Tables

  (defschema item-schema
    @doc  " Schema for poly tokens(items) \
          \ Column definitions: \
          \   @key: the unique id of item \
          \   title: the title of item, fixed \
          \   colors: the string composed by colors in hex form, of unique, fixed \
          \   rows: the number of rows in each frame, fixed \
          \   cols: the number of cols in each frame, fixed \
          \   frames: the number of frames, fixed \
          \   intervals: the intervals to control gif presentaion, in seconds, fixed \
          \   creator: the creator account of item, fixed \
          \   supply: the supply amount of item, fixed \
          \   urls: the urls for displaying item, variable \
          \   verifier: the address of verifier who confirms the accurancy of urls, variable \
          \   valid-hash: hash by item colors, used to check duplication, unique, fixed "

    title:string
    colors:string
    rows:integer
    cols:integer
    frames:integer
    intervals:[decimal]
    creator:string
    supply:decimal
    urls:[string]
    verifier:string
    valid-hash:string
  )

  (deftable items:{item-schema})

  (defschema entry
    @doc  " Schema for ledger \
          \ Column definitions: \
          \   @key: the combined key token:account for index \
          \   token: the token asset id \
          \   account: same account as kda account \
          \   balance: the amount of specific token \
          \   guard: empty guard here so program must verify user's kda guard "

    token:string
    account:string
    balance:decimal
    guard:guard
  )

  (deftable ledger:{entry})


  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin."
    (enforce-guard (at 'guard (coin.details "colorblock-admin")))
  )

  (defcap AUTH:bool (account:string)
    @doc " Enforce requester having the ownership of account in KDA network "
    (enforce-guard (at 'guard (coin.details account)))
  )

  (defcap DEBIT:bool (token:string sender:string amount:decimal)
    (compose-capability (AUTH sender))
  )
  (defcap CREDIT:bool (token:string receiver:string amount:decimal) 
    true
  )

  (defcap MINT:bool (token:string account:string amount:decimal)
    @managed   ; make sure one-shot (only-once), will trigger event
    (enforce-unit token amount)
    (enforce 
      (< 0.0 amount)
      "Amount must be larger than 0"
    )
    (compose-capability (AUTH account))
    (compose-capability (CREDIT token account amount))
  )

  (defcap ROTATE:bool (account:string)
    @doc "rotate guard for account"
    @managed  ;; one-shot
    true
  )

  (defcap TRANSFER:bool 
    (
      token:string
      sender:string
      receiver:string
      amount:decimal
    )
    @doc  " Controls transfer of TOKEN from SENDER to RECEIVER. \
          \ Verify these requirements: \
          \ 1. token, sender, receiver must be valid string \
          \ 2. sender must have corresponding account guard \
          \ 3. item must exist \
          \ 4. sender must be the owner of item "
    @managed amount TRANSFER-mgr  ; make sure amount is sufficient, will trigger event

    (enforce-valid-transfer sender receiver (precision token) amount)
    (compose-capability (DEBIT token sender amount))
    (compose-capability (CREDIT token receiver amount))
  )

  (defun TRANSFER-mgr:decimal
    ( managed:decimal
      requested:decimal
    )
    @doc " Manages TRANSFER cap AMOUNT where MANAGED is the installed quantity \
         \ and REQUESTED is the quantity attempting to be granted."
    (let ((newbal (- managed requested)))
      (enforce (>= newbal 0.0)
        (format "TRANSFER exceeded for balance {}" [managed])
      )
      newbal
    )
  )


  ; -------------------------------------------------------
  ; Constant

  (defconst TOKEN_PRECISION 0)

  (defconst MIN_FRAME_ROWS 2
    "The min rows for each frames"
  )
  (defconst MIN_FRAME_COLS 2
    "The min cols for each frames"
  )
  (defconst MAX_FRAME_ROWS 128
    "The max rows for each frames"
  )
  (defconst MAX_FRAME_COLS 128
    "The max cols for each frames"
  )
  (defconst CELL_LENGTH 6
    "The length for each cell"
  )
  (defconst MAX_TITLE_LENGTH 200
    "The max length of item title"
  )


  ; -------------------------------------------------------
  ; Utilities

  (defun key:string (token:string account:string)
    (format "{}:{}" [token account])
  )

  (defun precision:integer (token:string)
    @doc
      " Return maximum decimal precision for TOKEN."
    ; all token balance must be integer
    TOKEN_PRECISION
  )

  (defun enforce-unit:bool (token:string amount:decimal)
    (enforce
      (= (floor amount (precision token)) amount)
      "precision violation"
    )
  )

  (defun valid-item-unique (valid-hash:string key:string)
    (let
      ((db-valid-hash (at 'valid-hash (read items key))))
      (enforce
        (!= valid-hash db-valid-hash)
        "The item is already existed"
      )
    )
  )

  (defun valid-colors (colors:string rows:integer cols:integer frames:integer)
    @doc "check whether colors conforms to following rules: \
        \1. the length of colors = rows * cols * frames * cell-length \
        \2. rows between MIN_FRAME_ROWS and MAX_FRAME_ROWS \
        \3. cols between MIN_FRAME_COLS and MAX_FRAME_COLS \
        \4. frames cannot be less than zero \
        \5. colors in HEX format "

    ; Validate Rule-1
    (enforce
      (= (length colors) (fold (*) 1 [rows cols frames CELL_LENGTH]))
      "the length of colors is not correct"
    )

    ; Validate Rule-2
    (enforce 
      (and
        (<= MIN_FRAME_ROWS rows)
        (>= MAX_FRAME_ROWS rows)
      )
      (format
        "the number of rows in each frame expected in range of {} ~ {}"
        [
          MIN_FRAME_ROWS
          MIN_FRAME_ROWS
        ]
      )
    )

    ; Validate Rule-3
    (enforce 
      (and
        (<= MIN_FRAME_COLS cols)
        (>= MAX_FRAME_COLS cols)
      )
      (format
        "the number of cols in each frame expected in range of {} ~ {}"
        [
          MIN_FRAME_COLS
          MIN_FRAME_COLS
        ]
      )
    )

    ; Validate Rule-4
    (enforce 
      (< 0 frames)
      "the number of frames expected to be larger than 0"
    )

    ; Validate Rule-5
    ; split to multiple length-512 substrs as there's input length limitation
    (fold (valid-hex colors) 0 (make-list (+ 1 (/ (length colors) 512)) 1))
  )

  (defun valid-hex (colors:string i:integer v:integer)
    (let 
      (
        (partial-str (take 512 (drop (* 512 i) colors)))
      )
      (enforce 
        (or
          (= "" partial-str)
          (!= "-1" (str-to-int 16 partial-str))
        )
        "Using illegal letters in content, please use HEX charset"
      )
      (+ i 1)
    )
  )

  (defun valid-intervals
    ( intervals:[decimal]
      frames:integer
    )
    @doc " Check whether intervals conforms to following rules: \
        \1.each interval must larger than zero \
        \2.interval count equals frames "
    (enforce
      (< 0.0 (at 0 (sort intervals)))
      "Interval must be larger than 0"
    )
    (enforce
      (= frames (length intervals))
      "Interval count must equal to the number of frames"
    )
  )

  (defun empty-guard:guard ()
    (create-user-guard (empty-valid 1))
  )

  (defun empty-valid (n:integer)
    (enforce 
      (= n n)
      ""
    )
  )


  ; -------------------------------------------------------
  ; Item Functions

  (defun create-item
    ( token:string
      title:string 
      colors:string
      rows:integer
      cols:integer
      frames:integer
      intervals:[decimal]
      creator:string 
      amount:decimal
    )
    (create-item-with-verifier token title colors rows cols frames intervals creator amount [] "")
  )

  (defun create-item-with-verifier
    ( token:string
      title:string 
      colors:string
      rows:integer
      cols:integer
      frames:integer
      intervals:[decimal]
      creator:string 
      amount:decimal
      urls:[string]
      verifier:string
    )

    ; auth of verifier
    (if
      (> 0 (length urls))
      (enforce-guard (at 'guard (coin.details verifier)))
      ""
    )

    ; Validate base infomations
    (enforce
      (!= "" title)
      "Title can not be empty"
    )
    (enforce
      (>= MAX_TITLE_LENGTH (length title))
      (format
        "Illegal title: length larger than {}"
        [ MAX_TITLE_LENGTH ]
      )
    )

    ; Validate colors make sure it conforms to standards
    (valid-colors colors rows cols frames)

    ; Validate intervals
    (valid-intervals intervals frames)

    ; Validate creator
    (with-capability (MINT token creator amount)
      ; Insert into DB
      (let
        ; Create hash with colors
        ((valid-hash (hash colors)))

        ; Make sure there's no existance
        (map (valid-item-unique valid-hash) (keys items))

        ; Add entry, setting creator as owner
        (insert items token {
          "title" : title,
          "colors" : colors, 
          "rows" : rows, 
          "cols" : cols,
          "frames" : frames,
          "intervals" : intervals,
          "creator": creator, 
          "supply": amount,
          "urls": urls,
          "verifier": verifier,
          "valid-hash": valid-hash
        })
        ; Credit creator certain amount
        (credit token creator (empty-guard) amount)
      )
    )
  )

  (defun item-details-full:{item-schema} (id:string)
    (read items id)
  )

  (defun item-details:object (item:object{colorblock-poly-fungible-v1.account-details})
    (take ['title, 'creator, 'supply, 'urls, 'verifier] item)
  )


  ; -------------------------------------------------------
  ; Account Functions

  (defun create-account:string
    ( token:string
      account:string
      guard:guard
    )
    @doc " Create ACCOUNT for TOKEN with 0.0 balance, with empty GUARD "
    
    (enforce-valid-account account)

    (let 
      (
        (guard-kda (at 'guard (coin.details account)))
        (g-null (empty-guard))
      )
      ; Check whether account is existed
      (with-default-read ledger (key token account)
        { "balance" : -1.0 }
        { "balance" := balance }
        (if 
          (= balance -1.0)
          (insert ledger (key token account)
            { "token"   : token,
              "account" : account,
              "balance" : 0.0,
              "guard"   : g-null
            }
          )
          "Account already exists"
        )
      )
    )
  )

  (defun get-balance:decimal (token:string account:string)
    (at 'balance (read ledger (key token account)))
  )

  (defun details:object{colorblock-poly-fungible-v1.account-details} 
    ( token:string 
      account:string
    )
    (read ledger (key token account))
  )

  (defun all-items:list (account:string)
    (map (item-details) (select ledger (where 'account (= account))))
  )

  (defun rotate:string
    ( token:string
      account:string
      new-guard:guard
    )
    (enforce false "Please rotate your KDA account")
  )


  ; -------------------------------------------------------
  ; Transactional Functions

  (defun transfer:string
    ( token:string
      sender:string
      receiver:string
      amount:decimal
    )
    @doc "Transfers certain amount of TOKEN from SENDER to RECEIVER. \
         \ Managed by 'TRANSFER' capability."

    (enforce (!= sender receiver)
      "sender cannot be the receiver of a transfer"
    )
    (enforce-valid-transfer sender receiver (precision token) amount)

    (with-capability (TRANSFER token sender receiver amount)
      (debit token sender amount)
      (credit token receiver (empty-guard) amount)
    )
  )

  (defun transfer-create:string
    ( token:string
      sender:string
      receiver:string
      receiver-guard:guard
      amount:decimal
    )
    @doc " Transfers certain amount of TOKEN from SENDER to RECEIVER, \
         \ creating RECEIVER account if necessary with RECEIVER-GUARD. \
         \ Fails if account exists and GUARD does not match. \
         \ Managed by 'TRANSFER' capability. "

    (transfer token sender receiver amount)
  )

  (defun debit:string
    ( token:string
      account:string
      amount:decimal
    )

    (require-capability (DEBIT token account amount))

    (enforce-unit token amount)

    (with-read ledger (key token account)
      { "balance" := balance }

      (enforce (<= amount balance) "Insufficient funds")

      (update ledger (key token account)
        { "balance" : (- balance amount) }
      )
    )
  )

  (defun credit:string
    ( token:string
      account:string
      guard:guard
      amount:decimal
    )

    (require-capability (CREDIT token account amount))

    (enforce-unit token amount)

    (with-default-read ledger (key token account)
      { "balance" : 0.0 }
      { "balance" := balance }
      (write ledger (key token account)
        { "token" : token,
          "account" : account,
          "balance" : (+ balance amount),
          "guard": (empty-guard)
        }
      )
    )
  )

  (defpact transfer-crosschain:string
    ( token:string
      sender:string
      receiver:string
      receiver-guard:guard
      target-chain:string
      amount:decimal )
    (step (enforce false "cross chain not supported"))
  )

  ; -------------------------------------------------------
  ; Transaction Logs
  (defun items-txlog (tx-id:integer)
    (map (at 'key) (txlog items tx-id))
  )
  (defun ledger-txlog (tx-id:integer)
    (map (at 'key) (txlog ledger tx-id))
  )

)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table items)
    (create-table ledger)
  ]
)
