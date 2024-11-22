# sequelize
## Generate hypertable first time
```
SELECT create_hypertable('buslocation', by_range('time'));
```