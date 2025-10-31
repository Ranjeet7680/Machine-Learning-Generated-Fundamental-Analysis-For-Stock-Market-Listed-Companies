from sqlalchemy import create_engine, Column, Integer, String, Float, Enum, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import enum

Base = declarative_base()

class Category(enum.Enum):
    Pro = "Pro"
    Con = "Con"

class MLResult(Base):
    __tablename__ = 'ml'
    id = Column(Integer, primary_key=True)
    company_id = Column(String(50))
    metric_name = Column(String(255))
    metric_value = Column(Float)
    category = Column(Enum(Category))
    analysis_date = Column(TIMESTAMP)

# MySQL connection string
engine = create_engine("mysql+pymysql://root:your_password@localhost/financial_analysis")
Session = sessionmaker(bind=engine)
session = Session()

def save_results(records):
    for r in records:
        result = MLResult(
            company_id=r["company_id"],
            metric_name=r["metric_name"],
            metric_value=r["metric_value"],
            category=Category[r["category"]]
        )
        session.merge(result)
    session.commit()
