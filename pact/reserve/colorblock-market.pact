(namespace (read-msg 'ns))

(module colorblock-market GOVERNANCE
  @doc "module for \
      \1. helping users release items into market for sale \
      \2. supporting pricing and trading efficiently. "

  ; -------------------------------------------------------
  ; Capabilities

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin "
    (enforce-guard (at 'guard (coin.details "colorblock-admin")))
  )

)

