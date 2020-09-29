package demo;


import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Created by hanks.hu on 2019/4/17.
 */
public class FHSignDemo {

    private static String UTF8 = "UTF-8";

    private static String ALGORITHM = "HmacSHA1";

    public static void main(String args[]) {

        String appID = "demoID";
        String appKey = "demoKey";
        long timestamp = 1553138384575L;
        String body = "";
        String sign = getSign(appID, appKey, timestamp, body);
        System.out.println(String.format("sign: %s", sign));
    }

    private static String getSign(String fhAppID, String fhKey, long timestamp, String body) {

        try {
            byte[] appSignKey = HmacSHA1Encrypt(String.valueOf(timestamp).getBytes(UTF8), fhKey.getBytes(UTF8));
            byte[] bodySignKey = HmacSHA1Encrypt(fhAppID.getBytes(UTF8), appSignKey);
            byte[] dataSign = HmacSHA1Encrypt(body.getBytes(UTF8), bodySignKey);
            //System.out.println(String.format("appSignKey = %s, bodySignKey = %s, dataSign = %s", byte2hex(appSignKey), byte2hex(bodySignKey), byte2hex(dataSign)));
            return Base64.getEncoder().encodeToString(dataSign);
        } catch (Exception e) {
            return "";
        }
    }


    private static byte[] HmacSHA1Encrypt(byte[] encryptText, byte[] encryptKey) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(encryptKey, ALGORITHM);
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(secretKey);
            return mac.doFinal(encryptText);
        } catch (Exception err) {
            return null;
        }
    }

    private static String byte2hex(byte[] bt) {
        if(bt == null) {
            return null;
        } else {
            StringBuffer sb = new StringBuffer();

            for(int i = 0; i < bt.length; ++i) {
                int x = bt[i] & 255;
                int h = x >>> 4;
                int l = x & 15;
                sb.append((char)(h + (h < 10?48:87)));
                sb.append((char)(l + (l < 10?48:87)));
            }
            return sb.toString();
        }
    }
}
