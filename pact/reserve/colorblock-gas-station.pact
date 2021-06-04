(namespace (read-msg 'ns))

(module colorblock-gas-station GOVERNANCE

  (defcap GOVERNANCE ()
    @doc " Only support upgrading by admin."
    (enforce-guard (at 'guard (coin.details "colorblock-admin")))
  )

)

