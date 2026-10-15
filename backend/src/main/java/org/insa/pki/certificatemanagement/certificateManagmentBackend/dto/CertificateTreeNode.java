package org.insa.pki.certificatemanagement.certificateManagmentBackend.dto;

import java.util.ArrayList;
import java.util.List;

public class CertificateTreeNode {

    private String alias;
    private String type;
    private String subject;
    private List<CertificateTreeNode> children = new ArrayList<>();

    public CertificateTreeNode() {}

    public CertificateTreeNode(String alias, String type, String subject) {
        this.alias = alias;
        this.type = type;
        this.subject = subject;
    }

    public void addChild(CertificateTreeNode node) {
        this.children.add(node);
    }



    public String getAlias() {
        return alias;
    }

    public void setAlias(String alias) {
        this.alias = alias;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public List<CertificateTreeNode> getChildren() {
        return children;
    }

    public void setChildren(List<CertificateTreeNode> children) {
        this.children = children;
    }
}