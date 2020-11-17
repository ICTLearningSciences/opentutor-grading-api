SHELL := /bin/bash
MONGO_DOCKER_IMAGE=mongo:4.2
MONGO_DUMP_ROOT=$(PWD)/dump
MONGO_URI?=

check-mongo-uri:
ifndef MONGO_URI
	$(error MONGO_URI is undefined. Typically needs to be in a .env.<STAGE> file. )
endif

# Runs mongodump on env var MONGO_URI
# Often more convient to store MONGO_URI in .env.<STAGE> 
# and then call `make mongo-dump-<STAGE>`
mongo-dump-uri: check-mongo-uri
	docker run \
			--rm \
			--volume $(MONGO_DUMP_ROOT):/dump \
		$(MONGO_DOCKER_IMAGE) mongodump \
			--archive="dump/dump-$*-$(shell date '+%Y%d%mT%H%M%S').gz" \
			--gzip \
			--uri="$(MONGO_URI)"


# `make mongo-dump-<STAGE>`
#  Runs mongodump with MONGO_URI found in .env.<STAGE>
mongo-dump-%:
	@test -s "$(PWD)/.env.$*" || { echo "missing .env.$*"; exit 1; }
	@MONGO_URI=$(shell echo $$(grep -e ^MONGO_URI= '.env.dev' | cut -d '=' -f2-)) \
	$(MAKE) mongo-dump-uri

