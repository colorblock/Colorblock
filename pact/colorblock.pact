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
          \   id @key: hash by item matrix \
          \   title: the title of item, fixed \
          \   tag: the tags of item, fixed \
          \   description: the tags of item, fixed \
          \   frame: the width and height of each frame, need specify this for gif. [0 0] is default, fixed \
          \   matrix: the rgb data of item, each sub-list is a row of rgb-matrix, unique, fixed \
          \   creator: the account of item creator, fixed \
          \   onwer: the account of current owner, changeable "
    @model [
      (invariant (!= "" title))
      (invariant (!= [] frame))
      (invariant (!= [] matrix))
      (invariant (!= "" creator))
      (invariant (!= "" owner))
    ]

    title:string
    tag:[string]
    description:string
    frame:[integer]
    matrix:[[string]]
    creator:string 
    owner:string
  )

  (deftable items:{item-schema})

  (defschema account-schema
    @doc  " Schema for accounts \
          \ Column definitions: \
          \   account @key: same account as kda account \
          \   guard: same guard as kda account, fixed \
          \   username: the username to identify users, unique, changeable \
          \   avatar: blank, or id of one specific item owned by user, changeable \
          \   profile: profile of user, changeable"
    @model [
      (invariant (!= "" username))
    ]

    guard:guard
    username:string
    avatar:string
    profile:string
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
  (defconst MIN_MATRIX_WIDTH 4
    "The min width for rgb matrix"
  )
  (defconst MIN_MATRIX_HEIGHT 4
    "The min height for rgb matrix"
  )
  
  (defconst MAX_MATRIX_WIDTH 256
    "The max width for rgb matrix"
  )
  (defconst MAX_MATRIX_HEIGHT 256
    "The max height for rgb matrix"
  )

  (defconst RGB_CELL_LENGTH 6
    "The length for every RGB cell in matrix"
  )

  (defconst DEFAULT_FRAME_WIDTH 0
    "The default width for frame, it means a static image"
  )
  (defconst DEFAULT_FRAME_HEIGHT 0
    "The default height for frame, it means a static image"
  )

  (defconst MAX_TITLE_LENGTH 64
    "The max length of item title"
  )
  (defconst MAX_TAG_NUM 16
    "The max num of item tags"
  )
  (defconst MAX_TAG_LENGTH 32
    "The max length of item tag"
  )
  (defconst MAX_DESCRIPTION_LENGTH 256
    "The max length of item description"
  )

  (defconst MAX_USERNAME_LENGTH 64
    "The max length of account username"
  )
  (defconst MAX_PROFILE_LENGTH 256
    "The max length of account profile"
  )
  
  (defconst NULL_OWNER "NULL_OWNER")


  ; -------------------------------------------------------
  ; Utilities

  (defun validate-identifier (account:string)
    (enforce (!= "" account) "Empty identifier")
  )

  (defun valid-matrix (matrix:[[string]])
    @doc "check whether matrix conforms to following rules: \
        \1. matrix is a list with length ranging from min-const to max-const \
        \2. each element of matrix is also a list \
        \3. each element of sub-list is string with fix-const length \
        \4. each element of sub-list is string in specific charset \
        \5. all sub-lists have same element lengths \
        \6. these same lengths range from min-const to max-const "
    
    ; Validate Rule-1
    (enforce 
      (and
        (<= MIN_MATRIX_HEIGHT (length matrix))
        (>= MAX_MATRIX_HEIGHT (length matrix))
      )
      (format 
        "matrix height expected in range of {} ~ {}, but got {}"
        [ MIN_MATRIX_HEIGHT
          MAX_MATRIX_HEIGHT
          (length matrix)
        ]
      )
    )

    ; Validate Rule-5
    (enforce 
      (let* 
        (
          (length-list (map (length) matrix)) ; get length of every row
          (sorted (sort length-list))
          (reversed (reverse sorted))
        )
        (= (take 1 sorted) (take 1 reversed))
      )
      "matrix rows' lengths expected same, but got different lengths"
    )

    ; Validate other rules in each sub-list
    (map (valid-matrix-row) matrix)
  )

  (defun valid-matrix-row (sub-list:[string])
    @doc "verify pattern of matrix row"

    ; Validate Rule-2&6
    (enforce 
      (and
        (<= MIN_MATRIX_WIDTH (length sub-list))
        (>= MAX_MATRIX_WIDTH (length sub-list))
      )
      (format 
        "matrix width expected in range of {} ~ {}, but got {}"
        [ MIN_MATRIX_WIDTH
          MAX_MATRIX_WIDTH
          (length sub-list)
        ]
      )
    )

    ; Validate Rule-3
    (enforce
      (let
        ((sorted (sort (map (length) sub-list))))
        (and
          (= RGB_CELL_LENGTH (at 0 sorted))
          (= RGB_CELL_LENGTH (at 0 (reverse sorted)))
        )
      )
      (format
        "matrix cell content expected as string with {} words, got other length"
        [ RGB_CELL_LENGTH ]
      )
    )

    ; Validate Rule-4
    (enforce 
      (!= [] (map (str-to-int 16) sub-list))
      "Using illegal letters in content, please use HEX charset"
    )
  )


  (defun null-owner-guard ()
    (create-module-guard NULL_OWNER)
  )


  ; -------------------------------------------------------
  ; Item Functions

  (defun create-item
    ( title:string 
      tag:[string]
      description:string
      matrix:[[string]]
      creator:string 
    )
    (create-item-with-frame
      title
      tag
      description
      [DEFAULT_FRAME_WIDTH DEFAULT_FRAME_HEIGHT]
      matrix
      creator
    )
  )

  (defun create-item-with-frame
    ( title:string 
      tag:[string]
      description:string
      frame:[integer]
      matrix:[[string]]
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
      (>= MAX_TAG_NUM (length tag))
      (format
        "Illegal tag: more than {}"
        [ MAX_TAG_NUM ]
      )
    )
    (enforce
      (or
        (= 0 (length tag))
        (>= MAX_TAG_LENGTH (at 0 (reverse (sort (map (length) tag)))))
      )
      (format
        "Illegal tag: length larger than {}"
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

    ; Validate matrix, make sure it conforms to standards
    (valid-matrix matrix)

    ; Validate frame
    (enforce
      (and 
        (= 2 (length frame))
        (and
          (<= 0 (at 0 (sort frame)))
          (and
            (>= (length (at 0 matrix)) (at 0 frame))
            (>= (length matrix) (at 1 frame))
          )
        )
      )
      "Illegal width or height of frame"
    )

    ; Insert into DB
    (let
      ; Create hash with matrix
      ((id (hash matrix)))
      
      ; Acquire capability
      (with-capability (OWN-ACCOUNT creator)
        (with-capability (ITEM id)
          ; Add entry, setting creator as owner
          (insert items id {
            "title" : title,
            "tag" : tag,
            "description" : description,
            "frame" : frame,
            "matrix" : matrix,
            "creator" : creator,
            "owner" : creator
          })
        )
      )
    )
  )

  (defun item-details:object{item-schema} (id:string)
    @doc "Return details of item matched by given id"
    (read items id)
  )

  (defun all-items:[object{item-schema}] ()
    @doc "Return details of all items."
    (map (item-details) (keys items))
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
        "username" : account,
        "avatar" : "",
        "profile" : ""
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
            "username" : account,
            "avatar" : "",
            "profile" : ""
          })
        )
      )
    )
  )

  (defun update-account:string
    (
      account:string
      username:string
      avatar:string
      profile:string
    )
    @doc "Update infos of account."

    (with-read accounts account
      { "username" := cur-username,
        "avatar" := cur-avatar,
        "profile" := cur-profile,
        "guard" := guard
      }

      (enforce
        (>= MAX_USERNAME_LENGTH (length username))
        (format
          "Illegal username: length larger than {}"
          [ MAX_USERNAME_LENGTH ]
        )
      )
      (let ((name-count (length (select accounts (where 'username (= username))))))
        (enforce
          (or
            (= "" username)
            (or
              (= 0 name-count)
              (= username cur-username)  ; in case of same username
            )
          )
          (format
            "username already exists: {}" 
            [ username ]
          )
        )
      )
      (enforce
        (>= MAX_PROFILE_LENGTH (length profile))
        (format
          "Illegal profile: length larger than {}"
          [ MAX_PROFILE_LENGTH ]
        )
      )
      (let 
        ((
          own-avatar
          (or
            (= "" avatar)
            (= account (owner-of avatar))
          )
        ))
        (enforce
          own-avatar
          (format
            "Illegal avatar: account is not the owner of item @{}"
            [ avatar ]
          )
        )
      )
      (let 
        (
          (new-username (if (!= "" username) username cur-username))
          (new-avatar (if (!= "" avatar) avatar cur-avatar))
          (new-profile (if (!= "" profile) profile cur-profile))
        )
        ; verify guard for account security
        (with-capability (OWN-ACCOUNT account)
          (with-capability (ACCOUNT account guard)
            (update accounts account
              { "username" : new-username,
                "avatar" : new-avatar,
                "profile" : new-profile
              }
            )
          )
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
    ;(map (read items) (filter (is-owner account) (keys items)))
    (filter (is-owner account) (keys items))
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
