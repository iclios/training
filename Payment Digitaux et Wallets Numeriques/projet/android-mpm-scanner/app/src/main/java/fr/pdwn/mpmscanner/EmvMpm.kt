package fr.pdwn.mpmscanner

data class EmvMpmDecoded(
    val ok: Boolean,
    val crcOk: Boolean,
    val payloadFormat: String?,
    val poiMethod: String?,
    val dynamic: Boolean,
    val guid: String?,
    val merchantAccount: String?,
    val mcc: String?,
    val currency: String?,
    val amount: Double?,
    val country: String?,
    val merchantName: String?,
    val city: String?,
    val billNumber: String?,
    val raw: String
)

object EmvMpm {
    fun crc16CcittFalse(str: String): String {
        var crc = 0xFFFF
        for (ch in str) {
            crc = crc xor (ch.code shl 8)
            repeat(8) {
                crc = if (crc and 0x8000 != 0) {
                    ((crc shl 1) xor 0x1021) and 0xFFFF
                } else {
                    (crc shl 1) and 0xFFFF
                }
            }
        }
        return crc.toString(16).uppercase().padStart(4, '0')
    }

    fun parseTlv(payload: String): Map<String, String> {
        val map = linkedMapOf<String, String>()
        var i = 0
        while (i + 4 <= payload.length) {
            val id = payload.substring(i, i + 2)
            val len = payload.substring(i + 2, i + 4).toIntOrNull() ?: break
            if (i + 4 + len > payload.length) break
            val value = payload.substring(i + 4, i + 4 + len)
            map[id] = value
            i += 4 + len
        }
        return map
    }

    fun decode(payload: String): EmvMpmDecoded {
        val raw = payload.trim()
        val tags = parseTlv(raw)
        val crc = tags["63"]
        val crcOk = crc != null &&
            raw.endsWith(crc) &&
            crc16CcittFalse(raw.dropLast(4)) == crc
        val mai = tags["26"]?.let { parseTlv(it) } ?: emptyMap()
        val add = tags["62"]?.let { parseTlv(it) } ?: emptyMap()
        val amount = tags["54"]?.toDoubleOrNull()
        return EmvMpmDecoded(
            ok = tags["00"] == "01" && tags["01"] != null && crcOk,
            crcOk = crcOk,
            payloadFormat = tags["00"],
            poiMethod = tags["01"],
            dynamic = tags["01"] == "12",
            guid = mai["00"],
            merchantAccount = mai["01"],
            mcc = tags["52"],
            currency = tags["53"],
            amount = amount,
            country = tags["58"],
            merchantName = tags["59"],
            city = tags["60"],
            billNumber = add["01"],
            raw = raw
        )
    }
}
