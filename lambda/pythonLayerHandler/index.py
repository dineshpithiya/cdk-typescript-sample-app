import helperUtils
import json
import fastjsonschema
import requests
def handler(event, context):
    """
    Lambda function handler
    """
    print("Lambda running")
    print(helperUtils.get_addition())
    validate = fastjsonschema.compile({'type': 'string'})
    print(validate('hello'))
    x = requests.get('https://w3schools.com/python/demopage.htm')
    print(x.text)
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda layer testing!')
    }