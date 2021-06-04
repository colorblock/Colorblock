(namespace (read-msg 'ns))

(module colorblock GOVERNANCE
  @doc "module for \
      \1. creating colorblock user \
      \2. creating/transfering colorblock items"

  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin."
    (enforce-guard (at 'guard (coin.details "colorblock-admin")))
  )

)
