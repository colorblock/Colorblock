(define-keyset 'cb-admin-keyset (read-keyset "cb-admin-keyset"))
(module colorblock GOVERNANCE
  @doc "module for \
      \1. creating colorblock user \
      \2. creating/transfering colorblock items"

  (implements non-fungible-v1)
  (use coin [ details ])

  ; -------------------------------------------------------
  ; Schemas and Tables

  (defschema item-schema 
    @doc  " Schema for non-fungible-token \
          \ Column definitions: \
          \   id @key: hash by item cells \
          \   title: the title of item, fixed \
          \   tags: the tags of item, fixed \
          \   description: the tags of item, fixed \
          \   cells: the string composed by colors in hex form, of unique, fixed \
          \   rows: the number of rows in each frame, fixed \
          \   cols: the number of cols in each frame, fixed \
          \   frames: the number of frames, fixed \
          \   intervals: the intervals to control gif presentaion, in seconds, fixed \
          \   creator: the account of item creator, fixed \
          \   onwer: the account of current owner, changeable "
    @model [
      (invariant (!= "" title))
      (invariant (!= "" description))
      (invariant (!= [] tags))
      (invariant (!= "" cells))
      (invariant (!= 0 rows))
      (invariant (!= 0 cols))
      (invariant (!= 0 frames))
      (invariant (!= [] intervals))
      (invariant (!= "" creator))
      (invariant (!= "" owner))
    ]

    title:string
    tags:[string]
    description:string
    cells:string
    rows:integer
    cols:integer
    frames:integer
    intervals:[decimal]
    creator:string 
    owner:string
  )

  (deftable items:{item-schema})

  (defschema account-schema
    @doc  " Schema for accounts \
          \ Column definitions: \
          \   account @key: same account as kda account \
          \   guard: same guard as kda account, fixed \
          \   username: the username to identify users, unique, changeable"
    @model [
      (invariant (!= "" username))
    ]

    guard:guard
    username:string
  )

  (deftable accounts:{account-schema})


  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin."
    (enforce-keyset 'cb-admin-keyset)
  )

  (defcap ITEM:bool (id:string)
    @doc " Notifies of the creation/existence of ID as an NFT. \
         \ This can be used to assure presence of an NFT in a cross-chain \
         \ transaction. If so, implementors should accept a field 'proof' \
         \ in the cross-chain transaction that verifies existence of the \
         \ item on the target chain."
    @event
    true
  )

  (defcap TRANSFER:bool 
    (
      sender:string
      receiver:string
      id:string
    )
    @doc  " Controls transfer of ID from SENDER to RECEIVER. \
          \ Verify these requirements: \
          \ 1. sender, receiver, id must be valid string \
          \ 2. sender must have corresponding account guard \
          \ 3. item must exist \
          \ 4. sender must be the owner of item "
    @managed ;; one-shot
    (map (validate-identifier) [sender receiver id])
    (compose-capability (OWN-ACCOUNT sender))
    (let ((owner (owner-of id)))
      (enforce (= sender owner) "Sender is not owner")
    )
  )

  (defcap OWN-ACCOUNT:bool
    ( account:string )
    @doc " Verify that account has the corresponding account guard"
    @managed ;; one-shot
    (enforce-guard (at 'guard (read accounts account)))
  )

  (defcap ACCOUNT:bool
    ( account:string 
      guard:guard
    )
    @doc "Notifies creation or modification of ACCOUNT to GUARD."
    @event
    (validate-identifier account)
  )

  (defcap SEND-CROSSCHAIN:bool
    ( sender:string
      receiver:string
      receiver-guard:guard
      target-chain:string
      id:string )
    @doc "Notifies initial step of 'transfer-crosschain' on source chain."
    @event
    true
  )

  (defcap RECEIVE-CROSSCHAIN:bool
    ( sender:string
      receiver:string
      receiver-guard:guard
      source-chain:string
      id:string )
    @doc "Notifies final step of 'transfer-crosschain' on target chain."
    @event
    true
  )

  (defcap ROTATE:bool
    ( account:string )
    @doc "Controls rotation of ACCOUNT."
    @managed ;; one-shot
    (validate-identifier account)
    (enforce-guard (at 'guard (read accounts account)))
  )


  ; -------------------------------------------------------
  ; Constant
  (defconst MIN_FRAME_ROWS 4
    "The min rows for each frames"
  )
  (defconst MIN_FRAME_COLS 4
    "The min cols for each frames"
  )
  (defconst MAX_FRAME_ROWS 256
    "The max rows for each frames"
  )
  (defconst MAX_FRAME_COLS 256
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
  (defconst MAX_TAG_NUM 16
    "The max num of item tags"
  )
  (defconst MAX_TAG_LENGTH 32
    "The max length of item tags"
  )
  (defconst MAX_DESCRIPTION_LENGTH 256
    "The max length of item description"
  )

  (defconst NULL_OWNER "NULL_OWNER")


  ; -------------------------------------------------------
  ; Utilities

  (defun validate-identifier (account:string)
    (enforce (!= "" account) "Empty identifier")
  )

  (defun valid-cells (cells:string rows:integer cols:integer frames:integer)
    @doc "check whether cells conforms to following rules: \
        \1. the length of cells = rows * cols * frames * cell-length \
        \2. rows between MIN_FRAME_ROWS and MAX_FRAME_ROWS \
        \3. cols between MIN_FRAME_COLS and MAX_FRAME_COLS \
        \4. frames between MIN_FRAMES and MAX_FRAMES \
        \5. cells in HEX format "

    ; Validate Rule-1
    (enforce
      (= (length cells) (fold (*) 1 [rows cols frames CELL_LENGTH]))
      "the length of cells is not correct"
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
          MIN_FRAMES
        ]
      )
    )

    ; Validate Rule-5
    ; split to multiple length-512 substrs as there's input length limitation
    (fold (valid-hex cells) 0 (make-list (+ 1 (/ (length cells) 512)) 1))
  )

  (defun valid-hex (cells:string i:integer v:integer)
    (let 
      (
        (partial-str (take 512 (drop (* 512 i) cells)))
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


  (defun null-owner-guard ()
    (create-module-guard NULL_OWNER)
  )


  ; -------------------------------------------------------
  ; Item Functions

  (defun create-item
    ( title:string 
      tags:[string]
      description:string
      cells:string
      rows:integer
      cols:integer
      frames:integer
      intervals:[decimal]
      creator:string 
    )

    ; Validate creator
    (enforce
      (!= "" creator)
      "creator can not be empty"
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
    (enforce
      (>= MAX_TAG_NUM (length tags))
      (format
        "Illegal tags: more than {}"
        [ MAX_TAG_NUM ]
      )
    )
    (enforce
      (or
        (= 0 (length tags))
        (>= MAX_TAG_LENGTH (at 0 (reverse (sort (map (length) tags)))))
      )
      (format
        "Illegal tags: length larger than {}"
        [ MAX_TAG_LENGTH ]
      )
    )
    (enforce
      (>= MAX_DESCRIPTION_LENGTH (length description))
      (format
        "Illegal description: length larger than {}"
        [ MAX_DESCRIPTION_LENGTH ]
      )
    )
    (enforce
      (!= "" creator)
      "Creator can not be empty"
    )

    ; Validate cells make sure it conforms to standards
    (valid-cells cells rows cols frames)

    ; Validate intervals
    (valid-intervals intervals frames)

    ; Insert into DB
    (let
      ; Create hash with cells 
      ((id (hash cells)))
      
      ; Acquire capability
      (with-capability (OWN-ACCOUNT creator)
        (with-capability (ITEM id)
          ; Add entry, setting creator as owner
          (insert items id {
            "title" : title,
            "tags" : tags,
            "description" : description,
            "cells" : cells, 
            "rows" : rows, 
            "cols" : cols,
            "frames" : frames,
            "intervals" : intervals,
            "creator" : creator,
            "owner" : creator
          })
        )
      )
    )
  )

  (defun create-item-with-new-user
    ( title:string 
      tags:[string]
      description:string
      cells:string
      rows:integer
      cols:integer
      frames:integer
      intervals:[decimal]
      creator:string 
      guard:guard
    )
    @doc "Create new user first and then create item"

    (create-account-maybe creator guard)
    (create-item title tags description cells rows cols frames intervals creator)
  )

  (defun item-details:object{item-schema} (id:string)
    @doc "Return details of item matched by given id"
    (+ {'id: id} (read items id))
  )

  (defun all-items:[object{item-schema}] ()
    @doc "Return details of all items."
    (map (item-details) (keys items))
    ;(select items (constantly true))
    ;(select items (where 'owner (= "admin")))
  )


  ; -------------------------------------------------------
  ; Account Functions

  (defun create-account-maybe:string
    ( account:string
      guard:guard
    )
    @doc " Create ACCOUNT, skip if account already exists"
    (let ((g-null (create-user-guard (validate-identifier account))))  ; define empty guard
      (with-default-read accounts account
        { "guard" : g-null }
        { "guard" := g }
        (if 
          (= g-null g)
          (create-account account guard)
          "Account already exists"
        )
      )
    )
  )

  (defun create-account:string
    ( account:string
      guard:guard
    )
    @doc " Create ACCOUNT with 0.0 balance, with GUARD controlling access. \
         \ Emits ACCOUNT event."

    (if 
      (= NULL_OWNER account)
      (insert accounts account {  ; not checking coin if account is NULL_OWNER
        "guard" : guard,
        "username" : account
      })
      (with-capability (ACCOUNT account guard)
        ; enforce guard consistent with KDA here,
        ; but doesn't require owning the guard 
        ; so that one can transfer to another account which
        ; hasn't been initiated yet.
        (let ((guard-kda (at 'guard (coin.details account))))
          (enforce 
            (= guard guard-kda) 
            "Guard must match the same account of KDA"
          )
          (insert accounts account {
            "guard" : guard,
            "username" : account
          })
        )
      )
    )
  )

  (defun balance-of:integer (account:string)
    @doc "Count all items owned by ACCOUNT."
    ;; EXTREMELY unperformant method. Better to index with a separate table.
    (length (select items (where 'owner (= account))))
  )

  (defun is-owner:bool (account:string key:string)
    (= account (owner-of key))
  )
  (defun items-of:[object{item-schema}] (account:string)
    @doc "Fetch all items owned by ACCOUNT."
    ;; EXTREMELY unperformant method. Better to index with a separate table.
    ;(select items (where 'owner (= account)))
    (map (item-details) (filter (is-owner account) (keys items)))
    ;(filter (is-owner account) (keys items))
  )

  (defun owner-of:string (id:string)
    @doc "Return owner account of item matched by given id."
    (at 'owner (read items id))
  )

  (defun details:object{non-fungible-v1.account-details} (account:string)
    @doc " Get an object with details of ACCOUNT. \
         \ Fails if account does not exist."
    (+ {'account: account} (read accounts account))
  )

  (defun validate-owner:bool (account:string)
    @doc " Invoke capability to verify the ownership of account"
    (with-capability (OWN-ACCOUNT account)
      (enforce (!= "" account) "not blank")
    )
  )


  ; -------------------------------------------------------
  ; Transactional Functions

  (defun transfer:string
    ( sender:string
      receiver:string
      id:string
    )
    @doc "Transfers ownership of ID from SENDER to RECEIVER. \
         \ Managed by 'TRANSFER' capability."

    (with-capability (TRANSFER sender receiver id)
      (enforce (!= sender receiver) "Same transfer")
      (read accounts receiver) ;; enforces active receiver
      (update items id { 'owner: receiver })
    )
  )

  (defun transfer-create:string
    ( sender:string
      receiver:string
      receiver-guard:guard
      id:string 
    )
    @doc " Transfers ownership of ID from SENDER to RECEIVER, \
         \ creating RECEIVER account if necessary with RECEIVER-GUARD. \
         \ Fails if account exists and GUARD does not match. \
         \ Managed by 'TRANSFER' capability. \
         \ Emits ACCOUNT for newly-created accounts."
    (with-capability (TRANSFER sender receiver id)
      (enforce (!= sender receiver) "Same transfer")
      (create-account receiver receiver-guard)
      (update items id { 'owner: receiver })
    )
  )


  (defschema xchain source-chain:string)

  (defpact transfer-crosschain:string
    ( sender:string
      receiver:string
      receiver-guard:guard
      target-chain:string
      id:string )
    @doc " 2-step pact to transfer ownership of ID \
         \ from SENDER on current chain to RECEIVER on TARGET-CHAIN, \
         \ creating RECEIVER account if necessary with RECEIVER-GUARD. \
         \ Step 1 emits SEND-CROSSCHAIN event on source chain. \
         \ Step 1 is controlled by TRANSFER capability. \
         \ Step 2 emits RECEIVE-CROSSCHAIN event on target chain. \
         \ Step 2 emits ACCOUNT for newly-created accounts."
    (step
      (with-capability (TRANSFER sender receiver id)
        (with-capability (SEND-CROSSCHAIN sender receiver receiver-guard target-chain id)
          (validate-identifier target-chain)
          (let* ( (cid (at 'chain-id (chain-data)))
                  (r:object{xchain} { 'source-chain: cid }))
            (enforce (!= cid target-chain) "Target chain must differ from source")
            (update items id { 'owner: NULL_OWNER })
            (yield r target-chain)))))
    (step
      (resume { 'source-chain:= source-chain }
        (with-capability (RECEIVE-CROSSCHAIN sender receiver receiver-guard source-chain id)
          (create-account-maybe receiver receiver-guard)
          (update items id { 'owner: receiver }))))
  )


  (defun rotate:string
    ( account:string
      new-guard:guard
    )
    @doc " Update guard after coin's guard get updating \
        \  Command must have the guard of current account "
    (with-capability (ROTATE account)
      (with-capability (OWN-ACCOUNT account)
        (with-capability (ACCOUNT account new-guard)
          (let ((guard-kda (at 'guard (coin.details account))))
            (enforce 
              (= new-guard guard-kda) 
              "Guard must match the same account of KDA"
            )
          )
          (update accounts account {
            "guard" : new-guard
          })
        )
      )
    )
  )
  
)


(if (read-msg "upgrade")
  ["upgrade"]
  [
    (create-table items)
    (create-table accounts)
    (create-account NULL_OWNER (null-owner-guard))
  ]
)
