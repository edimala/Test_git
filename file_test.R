library(dplyr)
library(ggplot2)
library(lubridate)

# Load data
db <- read.csv("db_31mar18.csv")
cust <- read.csv("cust4.csv")

# Count db
db1 <- db %>%
  group_by(Source, Profile) %>%
  summarise(Nr_Cust = n())