(namespace (read-msg 'ns))

(module colorblock-test GOVERNANCE
  @doc "module for \
      \1. creating colorblock user \
      \2. creating/transfering colorblock items"

  (use coin [ details ])
  (use colorblock-fungible-util-test)
  (implements colorblock-poly-fungible-v1-test)

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
          \   valid-hash: hash by item colors, used to check duplication, unique, fixed "

    title:string
    colors:string
    rows:integer
    cols:integer
    frames:integer
    intervals:[decimal]
    creator:string
    supply:decimal
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
          \   guard: the same guard as kda account "

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
    (enforce-guard (at 'guard (coin.details "colorblock-admin-test")))
  )

  (defcap AUTH (token:string account:string)
    (enforce-guard
      (at 'guard
        (read ledger (key token account))
      )
    )
  )

  (defcap DEBIT (token:string sender:string)
    (compose-capability (AUTH token sender))
  )
  (defcap CREDIT (token:string receiver:string) 
    true
  )

  (defcap MINT (token:string account:string)
    @managed   ; make sure one-shot (only-once), will trigger event
    (compose-capability (AUTH token account))
    (compose-capability (CREDIT token account))
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
    (compose-capability (DEBIT token sender))
    (compose-capability (CREDIT token receiver))
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

  (defcap ROTATE:bool
    ( token:string account:string )
    @doc "Controls rotation of ACCOUNT."
    @managed  ;; one-shot
    (enforce-valid-account account)
    (enforce-guard (at 'guard (read ledger (key token account))))
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
  (defconst MIN_FRAMES 1
    "The min count of frames"
  )
  (defconst MAX_FRAMES 16
    "The max count of frames"
  )
  (defconst CELL_LENGTH 6
    "The length for each cell"
  )

  (defconst MIN_INTERVAL 0.01
    "The min interval limitation"
  )
  (defconst MAX_INTERVAL 1.0
    "The max interval limitation"
  )

  (defconst MAX_TITLE_LENGTH 64
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
        \4. frames between MIN_FRAMES and MAX_FRAMES \
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
      (and
        (<= MIN_FRAMES frames)
        (>= MAX_FRAMES frames)
      )
      (format
        "the number of frames expected in range of {} ~ {}"
        [
          MIN_FRAMES
          MAX_FRAMES
        ]
      )
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
        \1.each interval should between MIN_INTERVAL than MAX_INTERVAL \
        \2.interval count equals frames "
    (enforce
      (and
        (<= MIN_INTERVAL (at 0 (sort intervals)))
        (>= MAX_INTERVAL (at 0 (reverse (sort intervals))))
      )
      (format
        "Interval should between {} and {}"
        [MIN_INTERVAL, MAX_INTERVAL]
      )
    )
    (enforce
      (= frames (length intervals))
      "Interval count must equal to the number of frames"
    )
  )

  (defun validate-ownership (token:string account:string)
    (with-capability (AUTH token account)
      true
    )
  )

  (defun validate-guard:bool (account:string)
    (let 
      ((guard-kda (at 'guard (coin.details account))))
      (enforce-guard guard-kda) 
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
      guard:guard
    )

    ; Create account if not exists
    (create-account-maybe token creator guard)

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

    ; Validate amount
    (enforce-unit token amount)

    ; Validate creator
    (with-capability (MINT token creator)
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
          "valid-hash": valid-hash
        })
        ; Credit creator certain amount
        (credit token creator guard amount)
      )
    )
  )


  ; -------------------------------------------------------
  ; Account Functions

  (defun create-account-maybe:string
    ( token:string
      account:string
      guard:guard
    )
    @doc " Create ACCOUNT for TOKEN, skip if account already exists"
    (let ((g-null (create-user-guard (enforce-valid-account account))))  ; define empty guard
      (with-default-read ledger (key token account)
        { "guard" : g-null }
        { "guard" := g }
        (if 
          (= g-null g)
          (create-account token account guard)
          "Account already exists"
        )
      )
    )
  )

  (defun create-account:string
    ( token:string
      account:string
      guard:guard
    )
    @doc " Create ACCOUNT for TOKEN with 0.0 balance, with GUARD controlling access."
    
    (enforce-valid-account account)
    (let ((guard-kda (at 'guard (coin.details account))))
      ; enforce guard consistent with KDA here,
      ; but doesn't require owning the guard 
      ; so that one can transfer to another account which
      ; hasn't been initiated yet.
      (enforce 
        (= guard guard-kda) 
        "Guard must match the same account of KDA"
      )
      (insert ledger (key token account)
        { "token"   : token,
          "account" : account,
          "balance" : 0.0,
          "guard"   : guard
        }
      )
    )
  )

  (defun get-balance:decimal (token:string account:string)
    (at 'balance (read ledger (key token account)))
  )

  (defun details:object{colorblock-poly-fungible-v1-test.account-details} 
    ( token:string 
      account:string
    )
    (read ledger (key token account))
  )

  (defun rotate:string
    ( token:string
      account:string
      new-guard:guard
    )
    @doc " Update guard after coin's guard get updating \
        \  Command must have the guard of current kda account "
    (let ((guard-kda (at 'guard (coin.details account))))
      (enforce 
        (= new-guard guard-kda) 
        "Guard must match the same account of KDA"
      )
      (enforce-guard guard-kda)
      (update ledger (key token account) {
        "guard" : new-guard
      })
    )
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
      (with-read ledger (key token receiver)
        { "guard" := g }
        (debit token sender amount)
        (credit token receiver g amount)
      )
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

    (enforce (!= sender receiver)
      "sender cannot be the receiver of a transfer"
    )
    (enforce-valid-transfer sender receiver (precision token) amount)

    (with-capability (TRANSFER token sender receiver amount)
      (debit token sender amount)
      (credit token receiver receiver-guard amount)
    )
  )

  (defun debit:string
    ( token:string
      account:string
      amount:decimal
    )

    (require-capability (DEBIT token account))

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

    (require-capability (CREDIT token account))

    (enforce-unit token amount)

    (create-account-maybe token account guard)

    (with-read ledger (key token account)
      { "balance" := balance }

      (update ledger (key token account)
        { "balance" : (+ balance amount) }
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
