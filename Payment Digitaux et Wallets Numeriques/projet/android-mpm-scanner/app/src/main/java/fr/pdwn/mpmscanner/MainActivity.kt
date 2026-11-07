package fr.pdwn.mpmscanner

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.tabs.TabLayout
import com.google.zxing.integration.android.IntentIntegrator
import fr.pdwn.mpmscanner.databinding.ActivityMainBinding
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var lastPayload: String? = null
    private var payMode: PayMode = PayMode.QR
    private var scanMode: ScanMode = ScanMode.CONFIG
    private val io = Executors.newSingleThreadExecutor()

    private enum class ScanMode { CONFIG, PAY }
    private enum class PayMode { QR, WALLET }

    private val scanLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val intentResult = IntentIntegrator.parseActivityResult(result.resultCode, result.data)
            if (intentResult != null && intentResult.contents != null) {
                when (scanMode) {
                    ScanMode.CONFIG -> applyConfigScan(intentResult.contents)
                    ScanMode.PAY -> onPayScan(intentResult.contents)
                }
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val prefs = getSharedPreferences("pdwn", Context.MODE_PRIVATE)
        val saved = prefs.getString("gateway", "").orEmpty()
        binding.gatewayUrl.setText(saved)

        binding.tabs.addTab(binding.tabs.newTab().setText(R.string.tab_qr))
        binding.tabs.addTab(binding.tabs.newTab().setText(R.string.tab_wallet))
        binding.tabs.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) {
                showTab(tab.position)
            }
            override fun onTabUnselected(tab: TabLayout.Tab) {}
            override fun onTabReselected(tab: TabLayout.Tab) {}
        })

        binding.btnScanConfig.setOnClickListener {
            scanMode = ScanMode.CONFIG
            startScan("QR config en haut du navigateur PC")
        }

        binding.btnScan.setOnClickListener {
            scanMode = ScanMode.PAY
            startScan("QR MPM ou wallet — détection auto")
        }

        binding.btnPay.setOnClickListener { doPay(prefs) }

        binding.btnReconfig.setOnClickListener { showConfigScreen() }

        if (saved.isNotBlank() && !saved.contains("192.168.1.10")) {
            showPayScreen(saved)
        } else {
            showConfigScreen()
        }
    }

    private fun showConfigScreen() {
        binding.screenConfig.visibility = View.VISIBLE
        binding.screenPay.visibility = View.GONE
    }

    private fun showPayScreen(base: String) {
        binding.screenConfig.visibility = View.GONE
        binding.screenPay.visibility = View.VISIBLE
        binding.payGateway.text = base
        binding.tabs.getTabAt(0)?.select()
        showTab(0)
        binding.statusText.text = "Prêt — Scanner un QR de parcours, puis Payer"
    }

    private fun showTab(index: Int) {
        val wallet = index == 1
        binding.panelQr.visibility = if (wallet) View.GONE else View.VISIBLE
        binding.panelWallet.visibility = if (wallet) View.VISIBLE else View.GONE
        payMode = if (wallet) PayMode.WALLET else PayMode.QR
    }

    private fun startScan(prompt: String) {
        val integrator = IntentIntegrator(this)
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
        integrator.setPrompt(prompt)
        integrator.setBeepEnabled(true)
        integrator.setOrientationLocked(false)
        scanLauncher.launch(integrator.createScanIntent())
    }

    private fun applyConfigScan(raw: String) {
        val kitUrl = parseKitConfig(raw)
        if (kitUrl == null) {
            toast("Ce n’est pas le QR config")
            binding.configStatus.text = "Visez le QR config du navigateur PC"
            return
        }
        binding.gatewayUrl.setText(kitUrl)
        getSharedPreferences("pdwn", Context.MODE_PRIVATE)
            .edit()
            .putString("gateway", kitUrl)
            .apply()
        toast("L’application a bien enregistré les infos du serveur")
        binding.configStatus.text = "Infos enregistrées — test de connexion…"
        pingThenEnter(kitUrl)
    }

    private fun pingThenEnter(base: String) {
        io.execute {
            try {
                val conn = (URL("$base/api/health").openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 5000
                    readTimeout = 5000
                }
                val ok = conn.responseCode in 200..299
                runOnUiThread {
                    if (ok) {
                        toast("Serveur joignable")
                        showPayScreen(base)
                    } else {
                        binding.configStatus.setTextColor(Color.parseColor("#B00020"))
                        binding.configStatus.text =
                            "Infos enregistrées, mais HTTP ${conn.responseCode}.\nVérifiez le réseau puis réessayez."
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    binding.configStatus.setTextColor(Color.parseColor("#B00020"))
                    binding.configStatus.text =
                        "Infos enregistrées ($base).\nServeur injoignable — même Wi‑Fi, start.bat, port 3789.\nPuis Scanner à nouveau ou rouvrir l’app."
                    // On laisse quand même passer si l'URL est connue : l'étudiant peut réessayer le pay
                    showPayScreen(base)
                    binding.statusText.text =
                        "Attention : serveur pas encore joignable — vérifiez le réseau avant de payer"
                }
            }
        }
    }

    private fun onPayScan(raw: String) {
        if (parseKitConfig(raw) != null) {
            toast("QR config — utilisez « Changer le serveur »")
            return
        }
        val wallet = parseWalletCred(raw)
        if (wallet != null) {
            binding.dpanInput.setText(wallet.first)
            binding.cryptInput.setText(wallet.second)
            lastPayload = null
            binding.tabs.getTabAt(1)?.select()
            showTab(1)
            toast("Wallet détecté → onglet Wallet")
            binding.statusText.text = "Wallet prêt — montant puis Payer"
            return
        }
        val d = EmvMpm.decode(raw)
        lastPayload = raw
        binding.payloadText.text = raw
        binding.decodedText.text = buildString {
            appendLine(if (d.ok) "✓ EMV MPM valide" else "✗ Payload non valide")
            appendLine("CRC (63): ${if (d.crcOk) "OK" else "KO"}")
            appendLine("Montant (54): ${d.amount ?: "—"}")
            appendLine("Marchand (59): ${d.merchantName ?: "—"} · ${d.city ?: ""}")
            appendLine("Bill (62/01): ${d.billNumber ?: "—"}")
        }
        binding.tabs.getTabAt(0)?.select()
        showTab(0)
        if (d.ok) {
            toast("QR MPM détecté → onglet QR MPM")
            binding.statusText.text = "QR MPM prêt — Payer"
        } else {
            toast("QR non reconnu")
            binding.statusText.text = "QR invalide"
        }
    }

    private fun currentGateway(prefs: android.content.SharedPreferences): String? {
        val base = binding.gatewayUrl.text.toString().trim().trimEnd('/')
            .ifBlank { prefs.getString("gateway", "")!!.trim().trimEnd('/') }
            .replace("\\s+".toRegex(), "")
        if (base.isEmpty()) {
            toast("Configurez d’abord le serveur")
            showConfigScreen()
            return null
        }
        prefs.edit().putString("gateway", base).apply()
        return base
    }

    private fun doPay(prefs: android.content.SharedPreferences) {
        val base = currentGateway(prefs) ?: return
        when (payMode) {
            PayMode.QR -> {
                val payload = lastPayload
                if (payload.isNullOrBlank()) {
                    toast("Scannez d’abord un QR MPM")
                    return
                }
                ensureReachableThen(base) { payQr(base, payload) }
            }
            PayMode.WALLET -> {
                val dpan = binding.dpanInput.text.toString().trim()
                val crypt = binding.cryptInput.text.toString().trim()
                val amount = binding.amountInput.text.toString().trim().toDoubleOrNull()
                if (dpan.isEmpty() || crypt.isEmpty()) {
                    toast("Scannez un QR wallet ou saisissez DPAN + crypto")
                    return
                }
                if (amount == null || amount <= 0) {
                    toast("Montant invalide")
                    return
                }
                ensureReachableThen(base) { payWallet(base, dpan, crypt, amount) }
            }
        }
    }

    private fun ensureReachableThen(base: String, then: () -> Unit) {
        binding.statusText.text = "Connexion à $base …"
        io.execute {
            try {
                val conn = (URL("$base/api/health").openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 5000
                    readTimeout = 5000
                }
                val code = conn.responseCode
                runOnUiThread {
                    if (code in 200..299) then()
                    else showUnreachable(base, "HTTP $code")
                }
            } catch (e: Exception) {
                runOnUiThread { showUnreachable(base, e.javaClass.simpleName) }
            }
        }
    }

    private fun showUnreachable(base: String, detail: String) {
        toast("Impossible de joindre le serveur")
        binding.statusText.text =
            "Paiement impossible : téléphone ≠ kit.\n" +
                "URL : $base\n" +
                "Même Wi‑Fi · start.bat · Changer le serveur si besoin\n" +
                "($detail)"
    }

    private fun parseKitConfig(raw: String): String? {
        val t = raw.trim()
        Regex("^PDWNKIT\\|v1\\|(https?://\\S+)$", RegexOption.IGNORE_CASE).find(t)?.let {
            return it.groupValues[1].trimEnd('/')
        }
        if (Regex("^https?://[\\w.:\\[\\]-]+:\\d{2,5}/?$", RegexOption.IGNORE_CASE).matches(t)) {
            return t.trimEnd('/')
        }
        return null
    }

    private fun parseWalletCred(raw: String): Pair<String, String>? {
        val re = Regex("^PDWNWALLET\\|v1\\|dpan=([^|]+)\\|crypt=([A-Fa-f0-9]+)$")
        val m = re.find(raw.trim()) ?: return null
        return m.groupValues[1].trim() to m.groupValues[2].trim().uppercase()
    }

    private fun payQr(base: String, payload: String) {
        binding.btnPay.isEnabled = false
        postJson(
            "$base/api/pay/qr",
            JSONObject().put("payload", payload),
            onDone = { binding.btnPay.isEnabled = true },
            onOk = { code, _ ->
                toast("Paiement MPM enregistré")
                binding.statusText.text = "QR payé · HTTP $code"
            }
        )
    }

    private fun payWallet(base: String, dpan: String, crypt: String, amount: Double) {
        binding.btnPay.isEnabled = false
        postJson(
            "$base/api/pay/wallet",
            JSONObject()
                .put("dpan", dpan)
                .put("cryptogram", crypt)
                .put("amount", amount)
                .put("source", "android_apk"),
            onDone = { binding.btnPay.isEnabled = true },
            onOk = { code, body ->
                val ok = try {
                    JSONObject(body).optBoolean("ok", code in 200..299)
                } catch (_: Exception) {
                    code in 200..299
                }
                toast(if (ok) "Paiement wallet enregistré" else "Wallet decline")
                binding.statusText.text =
                    if (ok) "Wallet payé · HTTP $code" else "Decline · HTTP $code"
                val next = try {
                    JSONObject(body).optString("nextCryptogram", "")
                } catch (_: Exception) {
                    ""
                }
                if (next.isNotBlank()) binding.cryptInput.setText(next)
            }
        )
    }

    private fun postJson(
        urlStr: String,
        json: JSONObject,
        onDone: () -> Unit,
        onOk: (Int, String) -> Unit
    ) {
        io.execute {
            try {
                val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                    connectTimeout = 8000
                    readTimeout = 8000
                }
                OutputStreamWriter(conn.outputStream).use { w -> w.write(json.toString()) }
                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val body = BufferedReader(InputStreamReader(stream ?: conn.inputStream)).readText()
                runOnUiThread {
                    onDone()
                    if (code in 200..299) onOk(code, body)
                    else {
                        toast("Erreur $code")
                        binding.statusText.text = body
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    onDone()
                    val base = urlStr.substringBefore("/api/")
                    showUnreachable(base.ifBlank { urlStr }, e.javaClass.simpleName)
                }
            }
        }
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
    }
}
