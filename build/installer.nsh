!macro customHeader
    !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro customInit
    !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
!macroend

!macro customInstall
    ${StdUtils.InvokeShellVerb} $0 "$SMPROGRAMS" "${PRODUCT_FILENAME}.lnk" ${StdUtils.Const.ShellVerb.PinToTaskbar}
!macroend