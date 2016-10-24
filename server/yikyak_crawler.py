from yikyakapi.yikyak import YikYak

COUNTRY_CODE = "USA"
PHONE_NUMBER = "9126605242"

if __name__ == "__main__":
    client = YikYak()
    pin = input("Web authentication PIN: ")
    client.login(COUNTRY_CODE, PHONE_NUMBER, pin)
