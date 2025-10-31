import mysql.connector

def store_ml_results(data):
    """
    data: list of dicts
    Example:
    [
        {"company_id": "TCS", "metric_name": "ROE", "metric_value": 14.5, "category": "Pro"},
        {"company_id": "TCS", "metric_name": "DebtEquity", "metric_value": 7.2, "category": "Con"},
    ]
    """
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",
        database="financial_analysis"
    )
    cursor = connection.cursor()

    for record in data:
        cursor.execute("""
            INSERT INTO ml (company_id, metric_name, metric_value, category)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                metric_value = VALUES(metric_value),
                category = VALUES(category)
        """, (record["company_id"], record["metric_name"], record["metric_value"], record["category"]))

    connection.commit()
    cursor.close()
    connection.close()
