' Deschide WonderPages: porneste aplicatia in fundal daca nu ruleaza, apoi deschide browserul. Fara fereastra de terminal.
Set sh = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")
folder = fs.GetParentFolderName(WScript.ScriptFullName)
Function Running()
  On Error Resume Next
  Set h = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  h.setTimeouts 1500, 1500, 1500, 1500
  h.Open "GET", "http://localhost:4321/api/state", False
  h.Send
  Running = (Err.Number = 0 And h.Status = 200)
  Err.Clear
End Function
If Not Running() Then
  If fs.FileExists(folder & "\stop.flag") Then fs.DeleteFile folder & "\stop.flag"
  sh.Run "cmd /c """ & folder & "\porneste.bat"" ascuns", 0, False
  For i = 1 To 60
    WScript.Sleep 2000
    If Running() Then Exit For
  Next
End If
If Running() Then
  sh.Run "http://localhost:4321"
Else
  r = MsgBox("WonderPages nu a pornit inca." & vbCrLf & vbCrLf & "1. Verifica sa fie pornit Docker Desktop (Engine running)." & vbCrLf & "2. Asteapta un minut si deschide din nou scurtatura WonderPages." & vbCrLf & vbCrLf & "Vrei sa vezi jurnalul tehnic (wonderpages.log)?", vbYesNo + vbExclamation, "WonderPages")
  If r = vbYes And fs.FileExists(folder & "\wonderpages.log") Then sh.Run "notepad """ & folder & "\wonderpages.log"""
End If
